<template>
  <div class="header-bar">
    <span>Institute for Brain and Intelligence</span>
    <span>Human Neuron Data Management System</span>
    <!-- <el-button class="db-agent-button" @click="chatVisible = true">DB-Agent</el-button> -->
    <el-button class="login-button" :link="true" @click="logoutAndRedirect">重新登录</el-button>

    <ChatWindow v-show="chatVisible" @close="chatVisible = false" />
  </div>
</template>

<script>
import ChatWindow from './ChatWindow.vue';

export default {
  name: 'HeaderBar',
  components: {
    ChatWindow,
  },
  data() {
    return {
      chatVisible: false,
    };
  },
  methods: {
    logoutAndRedirect() {
      localStorage.removeItem('access_token');
      localStorage.removeItem('is_guest');
      localStorage.removeItem('productionTrend');
      localStorage.removeItem('token_expiry');
      this.$router.push('/login');
    },
  },
};
</script>

<style scoped>
.header-bar {
  background: linear-gradient(to right, #2c3e50, #34495e);
  width: 100%;
  height: 80px;
  color: #ecf0f1;
  text-align: center;
  padding: 15px 20px;
  font-size: 20px;
  font-weight: 500;
  font-family: 'Helvetica Neue', sans-serif;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  /* position: relative; */
}

.db-agent-button {
  position: absolute;
  top: 35px;
  left: 230px;
  font-size: 14px;
  color: #d9eff4 !important;
  background: transparent;
  cursor: pointer;
  padding: 5px 10px;
}

.db-agent-button:hover {
  color: #3498db !important;
}

.login-button {
  position: absolute;
  top: 38px;
  right: 40px;
  font-size: 14px;
  color: #d9eff4 !important;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 5px 10px;
  text-decoration: underline;
}

.login-button:hover {
  color: #3498db !important;
}
</style>
