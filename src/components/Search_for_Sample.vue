<template>
  <el-card class="search-box-card" shadow="hover">
    <el-collapse v-model="isExpanded">
      <el-collapse-item name="1">
        <template #title>
          <span class="search-title">Search Samples</span>
        </template>
        <el-form ref="searchForm" :model="searchQuery" label-width="150px" class="custom-box-content">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="Sample Source">
                <el-select v-model="searchQuery.sample_source" multiple placeholder="Chose Sample Source">
                  <el-option v-if="searchQuery.sample_source.length > 0" label="None" value="none"></el-option>
                  <el-option v-for="option in sampleSourceOptions" :key="option" :label="option" :value="option"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="Patient ID">
                <el-select v-model="searchQuery.patient_ID" multiple placeholder="Chose Patient ID">
                  <el-option v-if="searchQuery.patient_ID.length > 0" label="None" value="none"></el-option>
                  <el-option v-for="option in patientIdOptions" :key="option.value" :label="option.label" :value="option.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="intracranial location">
                <el-input
                    v-model="searchQuery.intracranial_location"
                    placeholder="please input intracranial location"
                    clearable
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="brain region">
                <el-input
                    v-model="searchQuery.english_abbr_nj"
                    placeholder="please input abbreviation of brain region"
                    clearable
                ></el-input>
              </el-form-item>
            </el-col>
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
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'Search Samples',
  data() {
    return {
      isExpanded: ['1'],
      searchQuery: {
        sample_source: [],  // 新增的搜索条件
        patient_ID: [],
        intracranial_location: '',
        english_abbr_nj: ''
      },
      sampleSourceOptions: ['BJ-TT','NanJ-JZ','NanJ-NK','NanJ-JSP','SH-HS'],  // 来源选项
      patientIdOptions: []
    };
  },
  watch: {
    // 当 sample_source 发生变化时
    'searchQuery.sample_source'(newVal) {
      if (newVal.includes('none')) {
        // 用户选中了 "None" 表示清空
        this.searchQuery.sample_source = [];
      }
    },
    // 当 patient_ID 发生变化时
    'searchQuery.patient_ID'(newVal) {
      if (newVal.includes('none')) {
        this.searchQuery.patient_ID = [];
      }
    },
    'searchQuery.intracranial_location'(newVal) {
      if (newVal.includes('none')) {
        this.searchQuery.intracranial_location = '';
      }
    }
  },
  mounted() {
     this.fetchOptions();
  },
  methods: {
    fetchOptions() {
     axios.get('/api/get-patientID')
        .then(response => {
          // this.sampleSourceOptions=response.data.categories;
          this.patientIdOptions = response.data.pid_options;
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
        sample_source: [],  // 重置来源
        patient_ID:[]
      };
      let queryParams = {...this.searchQuery};
      // Emit the reset event with the reset query parameters
      this.$emit('search', queryParams);
    },
    async summary_sample() {
      try {
        const response = await axios.post(
          "/api/generate_sample_xlsx",
          {
            hospital: this.searchQuery.sample_source.join(",") || null, // 转为逗号分隔字符串
          },
          {
            responseType: "blob", // 确保返回的是文件类型
          }
        );

        // 创建下载链接
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = "sample_data.xlsx"; // 设置文件名
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url); // 释放内存
      } catch (error) {
        console.error("Error generating XLSX:", error);
        this.$message.error("Failed to generate XLSX");
      }
    },
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
