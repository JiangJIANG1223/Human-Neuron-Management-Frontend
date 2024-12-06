<template>
  <div class="chat-window">
    <div class="chat-header">
      <span>DB-Agent</span>
      <button class="close-button" @click="$emit('close')">x</button>
    </div>
    <div class="messages">
      <div
        v-for="message in messages"
        :key="message.id"
        :class="['message', message.sender]"
      >
        <div
          class="message-content"
          v-html="message.sender === 'system' ? message.renderedContent : message.content"
        ></div>
      </div>
    </div>
    <div class="input-area">
      <input
        v-model="userInput"
        @keyup.enter="sendMessage"
        placeholder="Enter your question here..."
      />
      <button @click="sendMessage">Send</button>
    </div>
  </div>
</template>

<script>
import axios from '@/axios';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export default {
  name: 'ChatWindow',
  data() {
    return {
      userInput: '',
      messages: [],
    };
  },
  methods: {
    // 生成唯一的 session_id
    generateSessionId() {
      return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    async sendMessage() {
      if (this.userInput.trim() === '') return;

      // 确保每个用户都有唯一的 session_id
      let sessionId = localStorage.getItem('session_id');
      if (!sessionId) {
        sessionId = this.generateSessionId();
        localStorage.setItem('session_id', sessionId);
      }

      // 显示用户消息
      this.messages.push({
        id: Date.now(),
        sender: 'user',
        content: this.userInput,
      });

      const question = this.userInput;
      this.userInput = '';

      try {
        // 使用 axios 调用后端 API，发送 session_id 和 question
        const response = await axios.post('/api/agent', {
          session_id: sessionId,
          question,
        });

        // 显示系统回复，渲染 Markdown 内容
        this.messages.push({
          id: Date.now(),
          sender: 'system',
          content: response.data.answer,
          renderedContent: this.renderMarkdown(response.data.answer),
        });
      } catch (error) {
        console.error(error);
        const errorMessage = 'An error occurred. Please try again later.';
        this.messages.push({
          id: Date.now(),
          sender: 'system',
          content: errorMessage,
          renderedContent: this.renderMarkdown(errorMessage),
        });
      }
    },
    renderMarkdown(content) {
      const html = marked(content);
      return DOMPurify.sanitize(html);
    },
  },
};
</script>

<style>
.chat-window {
  width: 40%;
  height: auto;             /* 高度自适应内容 */
  min-height: 60vh;
  max-height: 80vh;         /* 最大高度为视口高度的80% */
  background-color: #f9f9f9;
  border: 1px solid #ccc;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);

  /* 新增定位样式 */
  position: fixed;
  bottom: 20px; /* 距离窗口底部20px */
  right: 20px;  /* 距离窗口右侧20px */
  /* top: 50%;
  left: 50%;
  transform: translate(-50%, -50%); */
  z-index: 1000; /* 确保在页面上层显示 */
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #2c3e50;
  color: #ecf0f1;
  padding: 10px;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.close-button {
  background: transparent;
  border: none;
  color: #ecf0f1;
  font-size: 16px;
  cursor: pointer;
}

.messages {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.message {
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.message.system {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 10px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
  background-color: #ecf0f1;
  color: #2c3e50;
  text-align: left;
}

.message.user .message-content {
  background-color: #3498db;
  color: #ffffff;
}

.message.system .message-content {
  background-color: #ecf0f1;
  color: #2c3e50;
}

.input-area {
  display: flex;
  padding: 10px;
  border-top: 1px solid #ccc;
  background-color: #fff;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}

.input-area input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  outline: none;
}

.input-area button {
  margin-left: 10px;
  padding: 8px 16px;
  border: none;
  background-color: #3498db;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
}

.input-area button:hover {
  background-color: #2980b9;
}
</style>
  
  
  