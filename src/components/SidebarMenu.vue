<template>
  <el-aside width="200px" style="background-color: #f2f2f2;">
    <el-menu @select="$emit('menu-select', $event)">
      <el-menu-item index="DataTable" icon="el-icon-s-home">Homepage</el-menu-item>
      <el-menu-item index="DataExplorer" icon="el-icon-pie-chart">Data Explorer</el-menu-item> <!-- 新增项 -->
      <el-menu-item index="DataStatus" icon="el-icon-info">Data Status</el-menu-item>
    </el-menu>
  </el-aside>
</template>

<script>
export default {
  name: 'SidebarMenu'
}
</script>



  
  