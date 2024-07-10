<template>
  <el-card class="search-box-card" shadow="hover">
    <el-collapse v-model="isExpanded">
      <el-collapse-item name="1">
        <template #title>
          <span class="search-title">Search</span>
        </template>
        <el-form ref="searchForm" :model="searchQuery" label-width="150px" class="custom-box-content">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="Cell ID">
                <el-row :gutter="10">
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
              <el-form-item label="Tissue ID">
                <el-select v-model="searchQuery.tissue_id" placeholder="Chose Tissue ID">
                  <el-option label="None" value=""></el-option>
                  <el-option v-for="option in tissueIdOptions" :key="option.value" :label="option.label" :value="option.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="Slice ID">
                <el-select v-model="searchQuery.slice_id" placeholder="Chose Slice ID">
                  <el-option label="None" value=""></el-option>
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
                <el-select v-model="searchQuery.brain_region" placeholder="Chose Brain Region">
                  <el-option label="None" value=""></el-option>
                  <el-option v-for="option in brainRegionOptions" :key="option.value" :label="option.label" :value="option.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="Lucifer Yellow IHC">
                <el-select v-model="searchQuery.lucifer_yellow_immunohistochemistry" placeholder="Chose Lucifer Yellow IHC">
                  <el-option label="None" value=""></el-option>
                  <el-option label="Yes" value="1"></el-option>
                  <el-option label="No" value="0"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="24" class="button-group">
              <el-button type="primary" @click="search" style="margin-left: 10px;">Search</el-button>
              <el-button type="default" @click="reset">Reset</el-button>
            </el-col>
          </el-row>
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
        tissue_id: '',
        slice_id: '',
        inject_method: '',
        fresh_perfusion: '',
        brain_region: '',
        lucifer_yellow_immunohistochemistry: ''
      },
      tissueIdOptions: [],
      sliceIdOptions: [],
      brainRegionOptions: []
    };
  },
  mounted() {
    this.fetchOptions();
  },
  methods: {
    fetchOptions() {
      axios.get('/api/get-options')  // 明确指定后端路径
        .then(response => {
          this.tissueIdOptions = response.data.tissue_id_options;
          this.sliceIdOptions = response.data.slice_id_options;
          this.brainRegionOptions = response.data.brain_region_options;
        })
        .catch(error => {
          console.error('Error fetching options:', error);
        });
    },
    search() {
      this.$emit('search', this.searchQuery);
    },
    reset() {
      this.$refs.searchForm.resetFields();
      this.searchQuery = {
        cell_id_start: '',
        cell_id_end: '',
        tissue_id: '',
        slice_id: '',
        // slicing_method: '',
        fresh_perfusion: '',
        brain_region: '',
        lucifer_yellow_immunohistochemistry: ''
      };
      this.$emit('search', this.searchQuery); // 确保重置后表格数据也被重置
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
