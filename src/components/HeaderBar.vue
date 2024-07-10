<template>
  <div class="header-bar">
    <span>Institute for Brain and Intelligence</span>
    <span>Human Neuron Data Management System</span>
    <el-button class="login-button" :link="true" @click="logoutAndRedirect">重新登录</el-button>
  </div>
</template>

<script>
export default {
  name: 'HeaderBar',
  methods: {
    logoutAndRedirect() {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('is_guest');
      this.$router.push('/login');
    }
  }
}
</script>

<style scoped>
.header-bar {
  background: linear-gradient(to right, #2c3e50, #34495e);
  width: 100%;
  height: 80px; /* 设置固定高度 */
  color: #ecf0f1;
  text-align: center;
  padding: 15px 20px;
  font-size: 20px;
  font-weight: 500;
  font-family: 'Helvetica Neue', sans-serif;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  display: flex; /* 使用 flex 布局 */
  flex-direction: column; /* 垂直排列子元素 */
  justify-content: flex-start; /* 垂直顶端对齐 */
  align-items: center; /* 水平居中 */
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
  text-decoration: underline; /* 增加下划线 */
}

.login-button:hover {
  color: #3498db !important; /* 修改悬停时的颜色 */
}

</style>
