<template>
  <el-card class="search-box-card" shadow="hover">
    <el-collapse v-model="isExpanded">
      <el-collapse-item name="1">
        <template #title>
          <span class="search-title">检索样本</span>
        </template>
        <el-form ref="searchForm" :model="searchQuery" label-width="150px" class="custom-box-content">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="样本医院检索">
                <el-select v-model="searchQuery.sample_hospital" placeholder="Chose Sample Source">
                  <el-option v-if="searchQuery.sample_hospital.length > 0" label="None" value="none"></el-option>
                  <el-option v-for="option in sample_hospitalOptions" :key="option" :label="option" :value="option"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="病人编号检索">
                <el-select v-model="searchQuery.patient_ID" placeholder="Chose Sample ID">
                  <el-option v-if="searchQuery.patient_ID.length > 0" label="None" value="none"></el-option>
                  <el-option v-for="option in samplePIDOptions" :key="option.value" :label="option.label" :value="option.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <!--<el-col :span="6">
              <el-form-item label="搜索字符串">
                <el-input v-model="searchQuery.inputString" placeholder="输入搜索字符串"></el-input>
              </el-form-item>
            </el-col>-->
          </el-row>
          <el-col :span="24" class="button-group">
            <el-button type="primary" @click="search" style="margin-left: 10px;">Search</el-button>
            <el-button type="default" @click="reset" style="margin-left: 10px;">Reset</el-button>
            <el-button type="default" @click="summary_sample" >Count</el-button>
          </el-col>

        </el-form>
      </el-collapse-item>
    </el-collapse>
  </el-card>
</template>

<script>
import axios from '@/axios';

export default {
  name: '检索样本',
  data() {
    return {
      isExpanded: ['1'],
      searchQuery: {
        sample_hospital: '',  // 新增的搜索条件
        patient_ID: '',
        // inputString: '' // 新增的输入字符串

      },
      sample_hospitalOptions: ['BJ-TT','NanJ-JZ','NanJ-NK','NanJ-JSP','SH-HS'],  // 来源选项
      samplePIDOptions: []


    };
  },
  mounted() {
     this.fetchOptions();
  },
  methods: {
    fetchOptions() {
      // Fetch source options from /api/sample-source-distribution
     //axios.get('/api/sample-source-distribution')
     axios.get('/api/get-samplePID')
        .then(response => {
          // this.sample_hospitalOptions=response.data.categories;
          this.samplePIDOptions = response.data.pid_options;
        })
        .catch(error => {
          console.error('Error fetching source options:', error);
        });
    },
    search() {
      // Ensure array parameters are serialized correctly
      let queryParams = {
        ...this.searchQuery
      };
      this.$emit('search', queryParams);
      // alert(this.searchQuery.inputString); // 弹出用户输入的字符串
    },
    reset() {
      this.$refs.searchForm.resetFields();
      this.searchQuery = {
        sample_hospital: '',  // 重置来源
        patient_ID:'',
        // inputString: '' // 重置输入字符串
      };
      let queryParams = {
        ...this.searchQuery
      };
      // Emit the reset event with the reset query parameters
      this.$emit('search', queryParams);
    },
    async summary_sample() {
      // alert(`${this.searchQuery.sample_hospital}`);
      try {
        const response = await axios.post('/api/generate_sample_xlsx', {
          hospital: this.searchQuery.sample_hospital
        }, {
          responseType: 'blob' // 重要：设置响应类型为 blob
        });

        // 创建下载链接
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'sample_Imagedata.xlsx'; // 设置下载文件名
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url); // 释放内存
      } catch (error) {
        alert('Failed to generate XLSX');
        console.error(error);
      }
    }
  }
};
</script>

<style scoped>
.search-box-card {
  padding: 4px;
  margin-bottom: 20px;
  /* padding-right: 40px; */
}

.custom-box-content {
  padding-left: 20px;
  padding-right: 30px; /* 右边距 */
}

.search-title {
  font-size: 24px;
  font-weight: bold;
}

.button-group {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 10px;
}
</style>
