// main.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { crypto } from "https://deno.land/std/crypto/mod.ts";
import { load } from "https://deno.land/std@0.208.0/dotenv/mod.ts";

const env = await load();

const kv = await Deno.openKv();
const html = await Deno.readTextFile("./static/index.html");
const script = await Deno.readTextFile("./static/script.js");
const style = await Deno.readTextFile("./static/style.css");

const DEEPSEEK_API_URL = "https://deepseek.deno.dev/api/chat";

interface Message {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file';
  content: string;
  timestamp: number;
  role: 'user' | 'ai';
  filename?: string; // 添加可选的文件名
  mimeType?: string; // 添加可选的 MIME 类型
}

interface ImageMessage {
  id: string;
  type: 'image';
  content: string;
  role: 'user';
  loading?: boolean;
  error?: boolean;
}
 
interface MessageUpdates {
  content?: string;
  loading?: boolean;
  error?: boolean;
}

interface UploadRequest {
  filename: string;
  contentType: string;
  data: string;
}


interface UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
  filename?: string;
  mimeType?: string;
}

interface KVImage {
  id: string;
  url: string;
  timestamp: number;
}

interface UploadOptions {
  title?: string;
  description?: string;
  tags?: string;
  album_id?: string;
  category_id?: string;
  width?: number;
  expiration?: string;
  nsfw?: 0 | 1;
  format?: "json" | "redirect" | "txt";
  use_file_date?: 0 | 1;
}
const apiKey = Deno.env.get('PICGO_API_KEY');
if (!apiKey && Deno.env.get('DENO_ENV') === 'production') {
  throw new Error('Missing API key in production environment');
}

async function handler(req: Request): Promise<Response> {
  interface RequestParams {
    messages: Array<{
      role: 'user' | 'ai';
      content: string;
    }>;
    temperature?: number;
    max_tokens?: number;
  }
  const url = new URL(req.url);
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  if (url.pathname === '/') {
    return new Response(html, {
      headers: {
        'content-type': 'text/html',
        ...corsHeaders
      },
    });
  }
  
  if (url.pathname === '/script.js') {
    return new Response(script, {
      headers: {
        'content-type': 'application/javascript',
        ...corsHeaders
      },
    });
  }
  
  if (url.pathname === '/style.css') {
    return new Response(style, {
      headers: {
        'content-type': 'text/css',
        ...corsHeaders
      },
    });
  }
  if (url.pathname === '/api/messages') {
    if (req.method === 'GET') {
      try {
        const iter = kv.list({
          prefix: ['messages']
        });
        const messages = await Promise.all(
          Array.from(iter).map(async entry => entry.value)
        );
        return new Response(JSON.stringify(messages.sort((a, b) => a.timestamp - b.timestamp)), {
          headers: {
            'content-type': 'application/json',
            ...corsHeaders
          },
        });
      } catch (error) {
        console.error('Error fetching messages:', error); // 添加日志记录
        return new Response(JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: {
            'content-type': 'application/json',
            ...corsHeaders
          },
        });
      }
    }
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        const message: Message = {
          id: crypto.randomUUID(),
          type: body.type,
          content: body.content,
          timestamp: Date.now(),
          role: body.role || 'user'
        };
        await kv.set(['messages', message.id], message);
        return new Response(JSON.stringify(message), {
          headers: {
            'content-type': 'application/json',
            ...corsHeaders
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: {
            'content-type': 'application/json',
            ...corsHeaders
          },
        });
      }
    }
  }
  // 代理 /api/deepseek 请求
  if (url.pathname === "/api/deepseek") {
    try {
      // 获取查询参数
      const prompt = url.searchParams.get("prompt");
      console.log("Received prompt:", prompt); // 调试：打印接收到的 prompt
      if (!prompt) {
        return new Response(
          JSON.stringify({
            error: "Missing prompt parameter"
          }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );
      }

      // 构造目标 API 的 URL
      const apiUrl = new URL(DEEPSEEK_API_URL);
      apiUrl.searchParams.set("prompt", prompt);
      // console.log("Constructed API URL:", apiUrl.toString()); // 调试：打印构造的 API URL

      // 发起 GET 请求到目标 API
      const apiResponse = await fetch(apiUrl.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
      });

      // 检查响应状态
      if (!apiResponse.ok) {
        throw new Error(`DeepSeek API 响应错误: ${apiResponse.status}`);
      }

      // 透传流式响应
      if (apiResponse.body) {
        // console.log("API returned a stream response"); // 调试：流式响应
        return new Response(apiResponse.body, {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Transfer-Encoding": "chunked",
          },
        });
      }

      // 非流式响应处理
      const responseData = await apiResponse.json();
      console.log("API response data:", responseData); // 调试：打印 API 返回的完整数据

      // 提取 text 字段
      const responseText = responseData.text || responseData.choices?.[0]?.message?.content;
      console.log("Extracted response text:", responseText); // 调试：打印提取的 text 字段

      return new Response(JSON.stringify({ text: responseText }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
      });
    } catch (error) {
      console.error("Error in /api/deepseek:", error); // 调试：打印错误信息
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error"
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }
  }
if (url.pathname === "/api/upload") {
  try {
    const { filename, contentType, data } = await req.json();
    if (!filename || !contentType || !data) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    const binaryData = Uint8Array.from(atob(data), c => c.charCodeAt(0));
    // 新增类型解析逻辑
    const mainType = contentType.split('/')[0];
    const fileType = (
      mainType === 'image' || mainType === 'video' || mainType === 'audio' 
        ? mainType 
        : 'file'
    ) as 'image' | 'video' | 'audio' | 'file';
    console.log(`[${new Date().toISOString()}] [Upload] 开始上传图片: ${filename}`);
    console.log(`[${new Date().toISOString()}] [Upload] 图片大小: ${binaryData.length} bytes`);

    const formData = new FormData();
    formData.append('source', new Blob([binaryData], { type: contentType }), filename);

    console.log(`[${new Date().toISOString()}] [Upload] 正在发送请求到 PicGo...`);
    const response = await fetch("https://www.picgo.net/api/1/upload", {
      method: "POST",
      headers: { 
        "X-API-Key": apiKey,
        "Accept": "application/json"
      },
      body: formData
    });

    const result = await response.json();
    
    
    if (!response.ok) {
      console.error(`[${new Date().toISOString()}] [Upload] PicGo API 错误:`, result);
      throw new Error(result.error?.message || 'Upload failed');
    }









   if (result.image?.url) {
      const message = {
        id: crypto.randomUUID(),
        type: fileType,
        content: result.image.url,
        role: 'user',
        timestamp: Date.now(),
        filename: filename,
        mimeType: contentType
      };
      await kv.set(['messages', message.id], message);
      
      return new Response(JSON.stringify({
        success: true,
        ...message
      }), {
        headers: corsHeaders
      });
    }

  } catch (error) {
    console.error(`[${new Date().toISOString()}] [Upload] 上传失败:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: corsHeaders
    });
  }
}

if (url.pathname === '/api/save-image') {
  try {
    const message = await req.json();
    // Store the complete message under messages prefix
    await kv.set(['messages', message.id], message);
    return new Response(JSON.stringify({ success: true }), {
      headers: corsHeaders
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

  return new Response('Not Found', {
    status: 404,
    headers: corsHeaders
  });
}

serve(handler, {
  port: 8000
});