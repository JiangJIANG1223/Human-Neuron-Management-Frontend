<template>
  <div>
    <div class="button-group">
      <el-button type="primary" @click="openAddDialog">Upload</el-button>
      <el-button @click="exportData">Export</el-button>
    </div>
    <el-table :data="sampleInfo" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column prop="total_id" label="总表编号"></el-table-column>
      <el-table-column prop="patient_id" label="患者编号"></el-table-column>
      <el-table-column prop="sample_id" label="样本编号"></el-table-column>
      <el-table-column prop="patient_number" label="病人编号"></el-table-column>
      <el-table-column prop="tissue_id" label="组织编号"></el-table-column>
      <el-table-column prop="patient_age" label="患者年龄"></el-table-column>
      <el-table-column prop="english_abbr_nj" label="英文简称(南京编)"></el-table-column>
      <el-table-column label="操作" width="120">
        <template v-slot="scope">
          <el-button size="small" type="primary" @click="viewData(scope.row)">View</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Dialog for viewing and editing data -->
    <el-dialog title="View Sample Info" v-model="viewDialogVisible" width="74%">
      <el-form ref="viewFormRef" :model="viewForm" label-width="240px" class="custom-dialog-content">
        <div v-for="(section, sectionKey) in formSections" :key="sectionKey" class="form-section">
          <el-divider></el-divider>
          <el-row :gutter="20">
            <el-col :span="8" v-for="(item, index) in section.items" :key="index">
              <el-form-item :label="item.label" :prop="item.prop">
                <el-input v-model="viewForm[item.prop]" :readonly="!isEdit"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <div class="left-buttons">
          <el-button v-if="isEdit" type="danger" @click="confirmDelete">删除</el-button>
        </div>
        <div class="right-buttons">
          <el-button @click="viewDialogVisible = false">取消</el-button>
          <el-button v-if="!isEdit" type="primary" @click="startEditing">编辑</el-button>
          <el-button v-if="isEdit" type="primary" @click="submitEdit">保存</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- Dialog for upload data -->
    <el-dialog title="Upload Sample Info" v-model="addDialogVisible" @open="setDefaultValues" width="74%">
      <el-form ref="addForm" :model="form" label-width="240px" class="custom-dialog-content">
        <el-divider></el-divider>
        <el-row :gutter="20" v-for="(section, sectionKey) in formSections" :key="sectionKey">
          <el-col :span="8" v-for="item in section.items" :key="item.prop">
            <el-form-item :label="item.label" class="custom-form-item">
              <el-input 
                v-model="form[item.prop]" 
                :style="{ color: isDefaultValue[item.prop] ? 'gray' : 'black' }"
                @input="handleInput(item.prop)"
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">上传</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import axios from '@/axios';
import * as XLSX from 'xlsx';

export default {
  name: 'SampleInfo',
  data() {
    return {
      sampleInfo: [],
      selectedSamples: [],
      addDialogVisible: false,
      viewDialogVisible: false,
      isEdit: false,
      form: {
        total_id: '',
        patient_id: '',
        sample_id: '',
        id: '',
        patient_number: '',
        tissue_id: '',
        sample_slice_info: '',
        perfusion_info: '',
        perfusion_evaluation: '',
        patient_age: '',
        gender: '',
        surgery_date: '',
        sample_size: '',
        tumor_location: '',
        intracranial_location: '',
        english_abbr_nj: '',
        english_full_name: '',
        left_right_brain: '',
        sample_processing_method: '',
        removal_time: '',
        immersion_time: '',
        storage_location: '',
        sampling_method_personnel: '',
        send_sample_date: '',
        treatment_naive: '',
        treatment_received: '',
        pathological_diagnosis: ''
      },
      viewForm: {
        idx: null,
        total_id: '',
        patient_id: '',
        sample_id: '',
        id: '',
        patient_number: '',
        tissue_id: '',
        sample_slice_info: '',
        perfusion_info: '',
        perfusion_evaluation: '',
        patient_age: '',
        gender: '',
        surgery_date: '',
        sample_size: '',
        tumor_location: '',
        intracranial_location: '',
        english_abbr_nj: '',
        english_full_name: '',
        left_right_brain: '',
        sample_processing_method: '',
        removal_time: '',
        immersion_time: '',
        storage_location: '',
        sampling_method_personnel: '',
        send_sample_date: '',
        treatment_naive: '',
        treatment_received: '',
        pathological_diagnosis: ''
      },
      isDefaultValue: {},
      formSections: [
        {
          title: 'Sample Information',
          items: [
            { label: '总表编号', prop: 'total_id' },
            { label: '患者编号', prop: 'patient_id' },
            { label: '样本编号', prop: 'sample_id' },
            { label: 'ID', prop: 'id' },
            { label: '病人编号', prop: 'patient_number' },
            { label: '组织编号', prop: 'tissue_id' },
            { label: '样本切片情况', prop: 'sample_slice_info' },
            { label: '灌注情况', prop: 'perfusion_info' },
            { label: '灌注效果评价', prop: 'perfusion_evaluation' },
            { label: '患者年龄', prop: 'patient_age' },
            { label: '性别', prop: 'gender' },
            { label: '手术日期', prop: 'surgery_date' },
            { label: '样本大小', prop: 'sample_size' },
            { label: '肿瘤部位', prop: 'tumor_location' },
            { label: '颅内取材部位', prop: 'intracranial_location' },
            { label: '英文简称(南京编)', prop: 'english_abbr_nj' },
            { label: '英文全称', prop: 'english_full_name' },
            { label: '左/右脑', prop: 'left_right_brain' },
            { label: '样本处理方式', prop: 'sample_processing_method' },
            { label: '取下时间', prop: 'removal_time' },
            { label: '样本浸液时间', prop: 'immersion_time' },
            { label: '样本存放地点', prop: 'storage_location' },
            { label: '取样方式/人员', prop: 'sampling_method_personnel' },
            { label: '寄出/取样日期', prop: 'send_sample_date' },
            { label: 'Treatment Naive', prop: 'treatment_naive' },
            { label: '接受过何种治疗', prop: 'treatment_received' },
            { label: '病理诊断', prop: 'pathological_diagnosis' }
          ]
        }
      ]
    };
  },
  created() {
    this.fetchSampleInfo();
  },
  methods: {
    fetchSampleInfo() {
      axios.get('/api/sample_information')
      .then(response => {
        this.sampleInfo = response.data;
      });
    },
    openAddDialog() {
      this.addDialogVisible = true;
    },
    setDefaultValues() {
      axios.get('/api/defaultInfo/')
      .then(response => {
        Object.assign(this.form, response.data.last_record);
        this.isDefaultValue = {};
        for (const key in this.form) {
          if (this.form[key]) {
            this.isDefaultValue[key] = true;
          }
        }
      }).catch(error => {
        console.error(error);
      });
    },
    handleInput(prop) {
      this.isDefaultValue[prop] = false;
    },
    submitForm() {
      axios.post('/api/sample_information', this.form).then(response => {
        this.sampleInfo.push(response.data);
        this.fetchSampleInfo();
        this.addDialogVisible = false;
        this.$message.success('数据新增成功');
      }).catch(error => {
        console.error(error);
        this.$message.error('数据新增失败');
      });
    },
    handleSelectionChange(val) {
      this.selectedSamples = val;
    },
    exportData() {
      if (this.selectedSamples.length === 0) {
        this.$message.warning('请选择要导出的数据');
        return;
      }
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(this.selectedSamples);
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      XLSX.writeFile(wb, 'export.xlsx');
    },
    viewData(row) {
      this.viewForm = { ...row };
      this.isEdit = false;
      this.viewDialogVisible = true;
    },
    startEditing() {
      this.isEdit = true;
    },
    submitEdit() {
      axios.put(`/api/sample_information/${this.viewForm.idx}`, this.viewForm, {
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(response => {
        this.fetchSampleInfo();
        this.viewDialogVisible = false;
        this.$message.success('数据更新成功');
      }).catch(error => {
        console.error(error);
        this.$message.error('数据更新失败');
      });
    },
    confirmDelete() {
      this.$confirm('此操作将永久删除该数据, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.deleteData();
      }).catch(() => {
        this.$message.info('已取消删除');
      });
    },
    deleteData() {
      axios.delete(`/api/sample_information/${this.viewForm.idx}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(response => {
        this.fetchSampleInfo();
        this.viewDialogVisible = false;
        this.$message.success('数据删除成功');
      }).catch(error => {
        console.error(error);
        this.$message.error('数据删除失败');
      });
    }
  }
};
</script>

<style scoped>
.el-table {
  margin-bottom: 20px;
}
.button-group {
  margin-bottom: 20px;
}
.left-buttons {
  flex: 1;
  display: flex;
  justify-content: flex-start;
}
.right-buttons {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}
.dialog-footer {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
}
.custom-dialog-content {
  padding-left: 20px;
  padding-right: 50px; /* 右边距 */
}
</style>