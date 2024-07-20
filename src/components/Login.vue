<template>
  <div class="login-container">
    <el-card class="login-card">
      <h3>登录</h3>
      <el-form @submit.prevent="onSubmit">
        <el-form-item class="input-item" label="用户名">
          <el-input v-model="username" placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item class="input-item" label="密码">
          <el-input type="password" v-model="password" placeholder="请输入密码"></el-input>
        </el-form-item>
        <el-form-item class="button-container">
          <el-button type="default" @click="enterAsGuest">以访客进入</el-button>
          <el-button type="primary" @click="onSubmit">登录</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import axios from '@/axios';

export default {
  name: 'Login',
  data() {
    return {
      username: '',
      password: ''
    };
  },
  methods: {
    async onSubmit() {
      try {
        const response = await axios.post('/api/login/', {
          username: this.username,
          password: this.password
        });
        const access_token = response.data.access_token;
        const expires_in = response.data.expires_in;  // 获取过期时间（秒）
        const expiryTime = new Date().getTime() + expires_in * 1000;  // 计算过期时间戳
        
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('token_expiry', expiryTime);  // 存储过期时间
        localStorage.setItem('is_guest', 'false');
        this.$router.push('/main');
      } catch (error) {
        this.$message.error('登录失败');
      }
    },
    enterAsGuest() {
      localStorage.setItem('is_guest', 'true');
      this.$router.push('/main');
    }
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(to right, #2c3e50, #2e68a3);
}

.login-card {
  width: 400px;
  padding: 20px;
}

.input-item {
  display: flex;
  justify-content: space-between;
}

.el-form-item .el-input {
  width: 100%;
}

.button-container {
  display: flex;
  justify-content: space-between;
}
</style>