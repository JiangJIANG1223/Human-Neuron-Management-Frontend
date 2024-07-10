<script setup>

</script>

<template>
  <div style="display: flex; justify-content: flex-start; margin-bottom: 20px;">
    <el-button type="primary" icon="el-icon-plus" on-click="">新增</el-button>
    <el-button type="success" icon="el-icon-edit">修改</el-button>
    <el-button type="danger" icon="el-icon-delete">删除</el-button>
    <el-button type="info" icon="el-icon-upload">导出</el-button>
  </div>

  <el-table
      :data="paginatedData"
      style="width: 100%"
      :default-sort="{ prop: sortBy, order: sortOrder }"
  >
    <el-table-column
        v-for="header in headers"
        :key="header"
        :prop="header"
        :label="header"
        sortable
        @sort-change="handleSortChange"
    ></el-table-column>
  </el-table>
</template>

<style scoped>

</style>