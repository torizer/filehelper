const MAX_IMAGE_SIZE = 64 * 1024; // 64KB
const messageContainer = document.getElementById('messageContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const fileInput = document.getElementById('btnFile');
const deepseekButton = document.getElementById('btnDeepseek');
let isDeepseekMode = false;

function appendMessage(message) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message ' + (message.role === 'user' ? 'user' : 'ai');
  
  if (message.id) {
    messageDiv.setAttribute('data-message-id', message.id);
  }

  const metaContainer = document.createElement('div');
  metaContainer.className = message.role === 'user' ? 'user-meta' : 'ai-meta';

  const contentWrapper = document.createElement('div');
  contentWrapper.className = message.type === 'text' ? 'message-bubble' : 'file-wrapper';
  if (message.role === 'ai') {
    const avatar = document.createElement('img');
    avatar.className = 'ai-avatar';
    avatar.src = 'https://chat.deepseek.com/favicon.svg';
    const nickname = document.createElement('span');
    nickname.className = 'ai-nickname';
    nickname.textContent = 'DeepSeek';
    metaContainer.appendChild(avatar);
    metaContainer.appendChild(nickname);
  }
  
  switch (message.type) {
    case 'text':
      contentWrapper.textContent = message.content;
      break;

    case 'image':
      const imageContainer = document.createElement('div');
      imageContainer.className = 'image-container';
      const img = document.createElement('img');
      img.src = message.content;
      img.style.maxWidth = '100%';
      imageContainer.appendChild(img);

      if (message.loading) {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        const spinner = document.createElement('div');
        spinner.className = 'upload-loading'; // 修改为新的动画样式
        loadingOverlay.appendChild(spinner);
        imageContainer.appendChild(loadingOverlay);
      }

      if (updates.error) {
        const errorOverlay = document.createElement('div');
        errorOverlay.className = 'error-overlay';
        errorOverlay.innerHTML = `
          <div class="error-icon">❌</div>
          <div class="error-text">上传失败: ${updates.errorMessage || ''}</div>
        `; // 添加错误信息展示
        messageElement.querySelector('.image-container').appendChild(errorOverlay);
      }
      contentWrapper.appendChild(imageContainer);
      break;

    case 'video':
      const video = document.createElement('video');
      video.controls = true;
      video.style.maxWidth = '100%';
      video.src = message.content;
      contentWrapper.appendChild(video);
      break;

    case 'audio':
      const audio = document.createElement('audio');
      audio.controls = true;
      audio.src = message.content;
      contentWrapper.appendChild(audio);
      break;

    default:
      const fileIcon = document.createElement('img');
      fileIcon.className = 'file-icon';
      fileIcon.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAADsUlEQVRoge2ZW2xMQRjHf6vEpaq1VLdWBUmjrtWiLopIEImLePAg4YF4QIJIJISIeCAeJF4QJEKICPHgwYsHEi+CIJGISFyKuJRLtYoqWq2ibC3r4ZvN2e3ZPefM2d0g+yeTs5lvvpn5z8w333wzC/+QXnKB1cBBoBa4D7wG2oE2oAV4AlwGSoEZQHxv3jQSJACrgCrgM+Ax1D/gArAISPyTNw8wGjgAfFL4+C/AcWA+kP4nHDAf2AAM4CGgEsgH4v6EA4YBm4BGhQ+/AUqA1D/hQAKwFrivOLyngJVA8u92IAM4DLQqTkArsA1I+R0OZAC7gQ+KK98JnAKG/ioH4oEVwG3FyXOjDSj/FQ7kAJXAZ8WJc6MSyP6ZDowAzgDfFSeth3bgIJD5MxwYDewDvipOVi90DcjrTQeGAgeJzGSFogrI7Q0HRgGngR+Kk9NX+gqUAYO8OJAOnAO+KU5IpPQR2ARYkTgwGLgIfFeckEjpPbAB6E7OTge2Ay8UB46U2oFtwECvx+h/ZgDDgblAkU9dM1AFnAXqgZc+7eOlbClQAEyT8t5QI3AEOAk8lHLHgQgNRILhWxXXyKuagBJggMKYg4HNQJvimF7UKMkG1wfIMqCbmzZp/lzz+kBgD/BDcWw3qpJ3Rh9hfBJQrNDUfSqGC+yLLg4sBZ4rju9EN4FCIOlnbBisAcqAjxodVcBEr8GWALc0jLwD1gHJXoNZwCLglqaDzTKB1p/ogBOTgOM+bRqBVbqTB+I8HwRc0zDSJKtlHDCKmA80aBh5CywGkrw66QD2As81jLQCS4AkE0NbhLNEw8gPYCcwxLSzDcF/nqUaRl4B64FBJh1HAvXCWaphpA7YACQbdnoKuKxhpEFWK8W04wHAWg0jrdJ+sGnnA4A1QJOGkXKRF01hAWs1jLyUidM+tbbJ8dGu0f4kMMak85XAEw0jT0XAimQCdwFnNNpXA+NNOl8iql6kRr4Bm4mO5OZEBI18AKaZdD5flLtIjbyQjUhUlqoMuKth5AVQaNL5HOC8hpEmYLlBv4nSp0UjdfWiiH4sDwPOahipAWaZdD4duEhkKxDKyGD5/6ZhpBqYatL5VOCkhpFXwFKR+3QxFKjQMNII5Jl0ngKUA180jOw26TxZ3oQmDSPFkcSCL4K7qRlxCDWXtIBcDSOnTDpPBC5oGHHoqEnnCUC5ppE9Jp3HiY7TrmnkkEnn/EcP8BMrL4reGkeUKgAAAABJRU5ErkJggg==';
      
      const fileName = document.createElement('span');
      fileName.className = 'file-name';
      fileName.textContent = message.filename || '未知文件';
      
      const fileLink = document.createElement('a');
      fileLink.href = message.content;
      fileLink.target = '_blank';
      fileLink.appendChild(fileIcon);
      fileLink.appendChild(fileName);
      
      contentWrapper.appendChild(fileLink);
  }

  metaContainer.appendChild(contentWrapper);
  messageDiv.appendChild(metaContainer);
  messageContainer.appendChild(messageDiv);
  messageContainer.scrollTop = messageContainer.scrollHeight;
}

function updateMessage(messageId, updates) {
  const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
  if (!messageElement) return;

  if (updates.content) {
    const contentElement = messageElement.querySelector('img, video, audio');
    if (contentElement) {
      contentElement.src = updates.content;
    }

    // 修复文件链接更新
    const fileLink = messageElement.querySelector('a');
    if (fileLink) {
      fileLink.href = updates.content;
      if (updates.filename) {
        const fileName = fileLink.querySelector('.file-name');
        if (fileName) {
          fileName.textContent = updates.filename;
        }
      }
    }
  }

  if (updates.filename) {
    const fileName = messageElement.querySelector('.file-name');
    if (fileName) {
      fileName.textContent = updates.filename;
    }
  }

  if (typeof updates.loading !== 'undefined') {
    const loader = messageElement.querySelector('.loading-overlay');
    if (loader) {
      loader.style.display = updates.loading ? 'flex' : 'none';
    }
  }

  // 修复错误状态更新
  if (typeof updates.error !== 'undefined') {
    const errorOverlay = messageElement.querySelector('.error-overlay');
    if (errorOverlay) {
      errorOverlay.remove();
    }
    if (updates.error) {
      const errorOverlay = document.createElement('div');
      errorOverlay.className = 'error-overlay';
      errorOverlay.innerHTML = '❌ 上传失败';
      messageElement.querySelector('.image-container').appendChild(errorOverlay);
    }
  }
}

async function saveToKV(message) {
  try {
    const response = await fetch('/api/save-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });
    
    if (!response.ok) {
      throw new Error('Failed to save to KV');
    }
  } catch (error) {
    console.error('Error saving to KV:', error);
  }
}

async function sendTextMessage() {
  const content = messageInput.value.trim();
  if (!content) return;
  try {
    const userResponse = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'text',
        content,
        role: 'user'
      })
    });

    if (userResponse.ok) {
      messageInput.value = '';
      const userMessage = await userResponse.json();
      appendMessage(userMessage);

      if (isDeepseekMode) {
        const params = {
          messages: [{
            role: "user",
            content: content
          }],
          temperature: 0.7,
          max_tokens: 2048
        };

        const apiUrl = new URL('/api/deepseek', window.location.href);
        apiUrl.searchParams.set('prompt', JSON.stringify(params));

        const loadingMessage = {
          type: 'text',
          content: '...',
          role: 'ai'
        };
        appendMessage(loadingMessage);

        const apiResponse = await fetch(apiUrl.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
        });

        if (apiResponse.body) {
          const reader = apiResponse.body.getReader();
          const decoder = new TextDecoder();
          let responseContent = '';
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            try {
              const data = JSON.parse(buffer);
              responseContent += data.text;
              buffer = '';
            } catch (e) {
              // 等待更多数据
            }
          }
          removeLoadingMessage();
          appendMessage({
            type: 'text',
            content: responseContent,
            role: 'ai'
          });
        } else {
          const data = await apiResponse.json();
          removeLoadingMessage();
          appendMessage({
            type: 'text',
            content: data.text || data.choices?.[0]?.message?.content,
            role: 'ai'
          });
        }
      }
    }
  } catch (error) {
    console.error('发送消息失败:', error);
    appendMessage({
      type: 'text',
      content: 'AI服务暂时不可用，请稍后重试',
      role: 'ai'
    });
  }
}

function removeLoadingMessage() {
  const loadingMessages = document.querySelectorAll('.message.ai .loading-overlay');
  loadingMessages.forEach(loader => {
    loader.closest('.message').remove();
  });
}

if (deepseekButton) {
  deepseekButton.addEventListener('click', () => {
    isDeepseekMode = !isDeepseekMode;
    deepseekButton.classList.toggle('active', isDeepseekMode);
    const statusMessageDiv = document.createElement('div');
    statusMessageDiv.className = 'ai-status-message';
    statusMessageDiv.textContent = isDeepseekMode ? 'AI对话开启' : 'AI对话关闭';
    messageContainer.appendChild(statusMessageDiv);
  });
}

sendButton.addEventListener('click', sendTextMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendTextMessage();
  }
});

fileInput.addEventListener('change', async (e) => {
  const target = e.target;
  if (!(target instanceof HTMLInputElement)) return;
  const file = target.files?.[0];
  if (!file) return;

  try {
    const messageId = 'file_' + Date.now().toString();
    const fileType = getFileType(file.type);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result;
      if (!result) return;

      // 先显示加载中的消息
      appendMessage({
        id: messageId,
        type: fileType,
        content: result.toString(),
        role: 'user',
        loading: true,
        filename: file.name,
        mimeType: file.type
      });

      try {
        const uploadData = {
          filename: file.name,
          contentType: file.type,
          data: result.toString().split(',')[1]
        };

        // 上传文件
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(uploadData)
        });

        const json = await response.json();
        
        if (json.success && json.url) {
          // 创建消息对象
          const message = {
            id: messageId,
            type: fileType,
            content: json.url,
            role: 'user',
            timestamp: Date.now(),
            filename: json.filename,
            mimeType: json.mimeType
          };
          
          // 写入KV存储
          await saveToKV(message);
          
          // 更新消息显示
          updateMessage(messageId, {
            content: json.url,
            loading: false,
            filename: json.filename,
            mimeType: json.mimeType,
            error: false // 明确设置错误状态为false
          });
        } else {
          throw new Error(json.error || '文件上传失败');
        }
      } catch (error) {
        console.error('文件上传过程中出错:', error);
        updateMessage(messageId, {
          loading: false,
          error: true,
          errorMessage: error.message // 添加错误信息
        });
      }
    };
    
    reader.readAsDataURL(file);
  } finally {
    fileInput.value = '';
  }
});

// 保存到KV的函数
async function saveToKV(message) {
  try {
    const response = await fetch('/api/save-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });
    
    if (!response.ok) {
      throw new Error('Failed to save to KV');
    }
  } catch (error) {
    console.error('Error saving to KV:', error);
  }
}

function getFileType(mimeType) {
  const type = mimeType.split('/')[0];
  switch (type) {
    case 'image':
      return 'image';
    case 'video':
      return 'video';
    case 'audio':
      return 'audio';
    default:
      return 'file';
  }
}

async function loadMessages() {
  try {
    const response = await fetch('/api/messages');
    const messages = await response.json();
    messages.sort((a, b) => a.timestamp - b.timestamp)
           .forEach(message => {
      if (message.loading) {
        message.loading = false;
      }
      appendMessage(message);
    });
  } catch (error) {
    console.error('加载消息失败:', error);
  }
}

loadMessages();