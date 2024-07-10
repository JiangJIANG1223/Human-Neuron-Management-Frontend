<template>
  <div class="login-container">
    <el-card class="login-card">
      <h3>登录</h3>
      <el-form @submit.prevent="onSubmit">
        <el-form-item label="用户名">
          <el-input v-model="username"></el-input>
        </el-form-item>
        <el-form-item label="密码">
          <el-input type="password" v-model="password"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSubmit">登录</el-button>
          <el-button type="default" @click="enterAsGuest">以访客进入</el-button>
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
        const response = await axios.post('/login/', {
          username: this.username,
          password: this.password
        });
        const access_token = response.data.access_token;
        const refresh_token = response.data.refresh_token;
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
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
}

.login-card {
  width: 400px;
  padding: 20px;
}
</style>
