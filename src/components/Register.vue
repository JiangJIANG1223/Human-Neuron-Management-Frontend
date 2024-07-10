<template>
    <el-form ref="registerForm" :model="registerForm" @submit.native.prevent="onSubmit">
      <el-form-item label="用户名">
        <el-input v-model="registerForm.username"></el-input>
      </el-form-item>
      <el-form-item label="密码">
        <el-input type="password" v-model="registerForm.password"></el-input>
      </el-form-item>
      <el-button type="primary" @click="register">注册</el-button>
      <el-button type="default" @click="goToLogin">登录</el-button>
    </el-form>
  </template>
  
  <script>
  import axios from 'axios';
  import { useRouter } from 'vue-router';
  
  export default {
    name: 'Register',
    data() {
      return {
        registerForm: {
          username: '',
          password: ''
        }
      };
    },
    methods: {
      register() {
        axios.post('http://localhost:8000/register/', this.registerForm)
          .then(() => {
            this.$message.success('注册成功');
            this.$router.push('/login');
          })
          .catch(error => {
            console.error(error);
            this.$message.error('注册失败');
          });
      },
      goToLogin() {
        this.$router.push('/login');
      }
    }
  };
  </script>
  