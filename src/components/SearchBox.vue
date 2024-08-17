<template>
  <el-card class="search-box-card" shadow="hover">
    <el-collapse v-model="isExpanded">
      <el-collapse-item name="1">
        <template #title>
          <span class="search-title">Search</span>
        </template>
        <el-form ref="searchForm" :model="searchQuery" label-width="150px" class="custom-box-content">
          <el-row :gutter="20">
            <!-- 第一行：五个搜索栏 -->
            <el-col :span="6">
              <el-form-item label="Cell ID">
                <el-row :gutter="5">
                  <el-col :span="12">
                    <el-input v-model="searchQuery.cell_id_start" placeholder="Start"></el-input>
                  </el-col>
                  <el-col :span="12">
                    <el-input v-model="searchQuery.cell_id_end" placeholder="End"></el-input>
                  </el-col>
                </el-row>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="Sample ID">
                <el-select v-model="searchQuery.patient_number" multiple placeholder="Chose Sample ID" @change="handleSelectionChange('patient_number')">
                  <el-option v-if="searchQuery.patient_number.length > 0" label="None" value="none"></el-option>
                  <el-option v-for="option in sampleIdOptions" :key="option.value" :label="option.label" :value="option.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="Tissue ID">
                <el-select v-model="searchQuery.tissue_block_number" multiple placeholder="Chose Tissue ID" @change="handleSelectionChange('tissue_block_number')">
                  <el-option v-if="searchQuery.tissue_block_number.length > 0" label="None" value="none"></el-option>
                  <el-option v-for="option in tissueIdOptions" :key="option.value" :label="option.label" :value="option.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="Slice ID">
                <el-select v-model="searchQuery.slice_number" multiple placeholder="Chose Slice ID" @change="handleSelectionChange('slice_number')">
                  <el-option v-if="searchQuery.slice_number.length > 0" label="None" value="none"></el-option>
                  <el-option v-for="option in sliceIdOptions" :key="option.value" :label="option.label" :value="option.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          
            <el-col :span="6">
              <el-form-item label="Manual/Auto Inject">
                <el-select v-model="searchQuery.inject_method" placeholder="Chose Manual/Auto Inject">
                  <el-option label="None" value=""></el-option>
                  <el-option label="Manual" value="0"></el-option>
                  <el-option label="Auto" value="1"></el-option>
                </el-select>
              </el-form-item>
            </el-col>         
            <el-col :span="6">
              <el-form-item label="Fresh Infusion">
                <el-select v-model="searchQuery.fresh_perfusion" placeholder="Chose Fresh Infusion">
                  <el-option label="None" value=""></el-option>
                  <el-option label="Yes" value="1"></el-option>
                  <el-option label="No" value="0"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="Brain Region">
                <el-select v-model="searchQuery.brain_region" multiple placeholder="Chose Brain Region" @change="handleSelectionChange('brain_region')">
                  <el-option v-if="searchQuery.brain_region.length > 0" label="None" value="none"></el-option>
                  <el-option v-for="option in brainRegionOptions" :key="option.value" :label="option.label" :value="option.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>  
            <!-- <el-col :span="5">
              <el-form-item label="Lucifer Yellow IHC">
                <el-select v-model="searchQuery.immunohistochemistry" placeholder="Chose Lucifer Yellow IHC">
                  <el-option label="None" value=""></el-option>
                  <el-option label="Yes" value="1"></el-option>
                  <el-option label="No" value="0"></el-option>
                </el-select>
              </el-form-item>
            </el-col> -->
            <el-col :span="6">
              <el-form-item label="Sample Source">
                <el-select v-model="searchQuery.source" placeholder="Chose Sample Source" @change="handleSourceChange">
                  <el-option v-for="option in sourceOptions" :key="option" :label="option" :value="option"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-col :span="24" class="button-group">
            <el-button type="primary" @click="search" style="margin-left: 10px;">Search</el-button>
            <el-button type="default" @click="reset">Reset</el-button>
          </el-col>
          
        </el-form>
      </el-collapse-item>
    </el-collapse>
  </el-card>
</template>

<script>
import axios from '@/axios';

export default {
  name: 'SearchBox',
  data() {
    return {
      isExpanded: ['1'],
      searchQuery: {
        cell_id_start: '',
        cell_id_end: '',
        patient_number: [],
        tissue_block_number: [],
        slice_number: [],
        source: '',  // 新增的搜索条件
        inject_method: '',
        fresh_perfusion: '',
        brain_region: [],
        immunohistochemistry: ''
      },
      sampleIdOptions: [],
      tissueIdOptions: [],
      sliceIdOptions: [],
      sourceOptions: [],  // 来源选项
      brainRegionOptions: [],

    };
  },
  mounted() {
    this.fetchOptions();
  },
  methods: {
    fetchOptions() {
      axios.get('/api/get-options')  // 明确指定后端路径
        .then(response => {
          this.sampleIdOptions = response.data.sample_id_options
          this.tissueIdOptions = response.data.tissue_id_options;
          this.sliceIdOptions = response.data.slice_id_options;
          this.brainRegionOptions = response.data.brain_region_options;
        })
        .catch(error => {
          console.error('Error fetching options:', error);
        });

      // Fetch source options from /api/sample-source-distribution
      axios.get('/api/sample-source-distribution')
        .then(response => {
          this.sourceOptions = response.data.categories;  // 来源选项
        })
        .catch(error => {
          console.error('Error fetching source options:', error);
        });
    },
    handleSourceChange(selectedSource) {
    // 当选择来源时，获取并过滤 patient_number
    axios.get('/api/sample-source-distribution')
      .then(response => {
        const sourcePatientNumbers = response.data.source_patient_numbers[selectedSource] || [];
        const sampleIdValues = this.sampleIdOptions.map(option => option.value);

        // 取 sourcePatientNumbers 和 sampleIdValues 的交集
        this.searchQuery.patient_number = sourcePatientNumbers.filter(patientNumber => sampleIdValues.includes(patientNumber));
      })
      .catch(error => {
        console.error('Error fetching patient numbers for source:', error);
      });
    },
    search() {
      // Ensure array parameters are serialized correctly
      let queryParams = {
        ...this.searchQuery,
        patient_number: this.searchQuery.patient_number.join(','),
        tissue_block_number: this.searchQuery.tissue_block_number.join(','),
        slice_number: this.searchQuery.slice_number.join(','),
        brain_region: this.searchQuery.brain_region.join(',')
      };
      this.$emit('search', queryParams);
    },
    reset() {
      this.$refs.searchForm.resetFields();
      this.searchQuery = {
        cell_id_start: '',
        cell_id_end: '',
        patient_number: [],
        tissue_block_number: [],
        slice_number: [],
        source: '',  // 重置来源
        fresh_perfusion: '',
        brain_region: [],
        immunohistochemistry: ''
      };
      // this.$emit('search', this.searchQuery); // 确保重置后表格数据也被重置
    },
    handleSelectionChange(field) {
      if (this.searchQuery[field].includes('none')) {
        this.searchQuery[field] = [];
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
