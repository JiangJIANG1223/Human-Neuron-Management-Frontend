<!-- 
 * @FileDescription: Vue.js的单文件组件(SFC)，由三部分组成：<template>、<script>和<style>，用于人脑神经元数据管理功能。
                     根组件, 使用Element Plus的el-container组件作为容器。
 * @Author: Jiang Xiaoxuan
 * @Date: 2024-05-27
 -->

 <template>
  <div>
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
  created() {
    this.checkLoginStatus();
  },
  methods: {
    checkLoginStatus() {
      const token = localStorage.getItem('access_token');
      const isGuest = localStorage.getItem('is_guest') === 'true';
      if (token || isGuest) {
        if (this.$route.path === '/login') {
          this.$router.push('/main');
        }
      } else {
        if (this.$route.path !== '/login') {
          this.$router.push('/login');
        }
      }
    }
  },
  watch: {
    '$route'() {
      this.checkLoginStatus();
    }
  }
};
</script>


<style>
/* 导入 Element Plus 的 CSS 样式文件 */
@import 'element-plus/dist/index.css';

/* 为 html、body 和 #app 元素设置 100% 的高度，确保占满整个视口高度；设置 0 的外边距，去除默认的外边距 */
html, body, #app {
  height: 100%;
  margin: 0;
  font-family: 'Helvetica Neue', Arial, sans-serif;
}
</style>