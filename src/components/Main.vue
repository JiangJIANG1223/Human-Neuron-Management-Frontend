<template>
  <el-container class="main-container" direction="vertical">
    <el-header class="header-bar">
      <HeaderBar />
    </el-header>
    <el-container>
      <SidebarMenu @menu-select="handleMenuSelect" />
      <el-main class="main-content">
        <SearchBox @search="handleSearch" />
        <router-view :key="$route.fullPath" :search-query="searchQuery" :is-guest="isGuest"></router-view> <!-- 渲染子路由 -->
      </el-main>
    </el-container>
  </el-container>
</template>


<script>
import HeaderBar from './HeaderBar.vue';
import SidebarMenu from './SidebarMenu.vue';
import SearchBox from './SearchBox.vue';

export default {
  name: 'Main',
  components: {
    HeaderBar,
    SidebarMenu,
    SearchBox
  },
  data() {
    return {
      searchQuery: {},
      isGuest: localStorage.getItem('is_guest') === 'true'
    };
  },
  methods: {
    handleMenuSelect(component) {
      this.$router.push({ name: component });
    },
    handleSearch(query) {
      console.log('Search query:', query);
      this.searchQuery = query;
      if (this.$route.name !== 'DataTable') {
        this.$router.push({ name: 'DataTable' });
      } else {
        this.$forceUpdate(); // 强制更新组件，以确保搜索结果正确显示
      }
    }
  }
};
</script>

<style scoped>
.main-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
}

.main-content {
  flex: 1;
  padding: 20px;
  background-color: #ffffff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  margin: 20px;
}

.el-aside {
  background-color: #2c3e50;
  color: #ecf0f1;
}

.el-menu-item {
  padding-left: 20px !important;
}

.el-footer {
  background-color: #34495e;
  color: #ecf0f1;
  text-align: center;
  line-height: 60px;
  font-size: 18px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-box .el-input {
  margin-right: 10px;
}

.search-box .el-button {
  margin-left: 10px;
}

.el-button {
  border-radius: 4px;
}

.el-button--primary {
  background-color: #1abc9c;
  border-color: #1abc9c;
}

.el-button--default {
  background-color: #ecf0f1;
  border-color: #ecf0f1;
  color: #34495e;
}
</style>
  