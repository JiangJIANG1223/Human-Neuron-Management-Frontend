<template>
  <div>
    <SearchSample @search="onSearch" />
    <div class="button-group">
      <el-button type="primary" @click="openAddDialog" :disabled="isGuest">Upload</el-button>
      <el-button @click="exportData" :disabled="isGuest">Export</el-button>
    </div>
    <div class="select-all-container" style="display: flex; align-items: center; margin-top: 30px; margin-bottom: 2px; padding-left: 13px;">
      <el-checkbox v-model="selectAllPages" @change="handleSelectAllPages"> Select All Pages </el-checkbox>
    </div>
    <el-table ref="sampleInfo" :data="sampleInfo" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55"></el-table-column>
      <!-- <el-table-column prop="idx" label="Index" width="120"></el-table-column> -->
      <el-table-column prop="total_id" label="总表编号"></el-table-column>
      <el-table-column prop="patient_id" label="患者编号"></el-table-column>
      <el-table-column prop="sample_id" label="样本编号"></el-table-column>
      <el-table-column prop="patient_number" label="病人编号"></el-table-column>
      <el-table-column prop="tissue_id" label="组织编号"></el-table-column>
      <el-table-column prop="patient_age" label="患者年龄"></el-table-column>
      <el-table-column prop="english_abbr_nj" label="英文简称(南京编)"></el-table-column>

      <el-table-column prop="sample_snapshot" label="样本方位图"></el-table-column>
      <el-table-column prop="sample_image" label="样本影像"></el-table-column>
      <el-table-column prop="sample_annotation" label="样本3D标注"></el-table-column>

      <el-table-column label="操作" width="180">
        <template v-slot="scope">
             <div class="action-buttons">
                  <el-button size="small" type="primary" @click="viewData(scope.row)">View</el-button>
                  <el-button size="small" @click="download_SampleFiles(scope.row)":loading="samplefile_downloadLoading">Download</el-button>
            </div>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      background
      layout="prev, pager, next"
      :total="total"
      :page-size="pageSize"
      @current-change="handlePageChange"
    ></el-pagination>

    <!-- Dialog for viewing and editing data -->
    <el-dialog title="View Sample Info" v-model="viewDialogVisible" width="74%">

    <div>
        <el-button type="primary" @click="viewSampleSnapshot(this.viewForm)" style="margin-right: 10px;">
            查看样本方位图
        </el-button>
        <el-dialog v-model="snapshot_dialogVisible" title="样本方位图">
            <el-table :data="snapshot_imageFiles" style="width: 100%">
                <el-table-column prop="name" label="File Name" width="180">
                    <template v-slot="scope">
                        <el-link type="primary" @click="showImage(scope.row.url, scope.row.name)">
                            {{ scope.row.name }} <!-- 显示文件名 -->
                        </el-link>
                    </template>
                </el-table-column>
            </el-table>
            <el-dialog :title="current_image_name" v-model="samplesnapshot_ImageVisible" width="50%">
                <img v-if="current_samplesnapshot" :src="current_samplesnapshot" alt="Preview" style="width: 100%;">
            </el-dialog>
        </el-dialog>
    </div>

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

          <el-button type="primary" @click="select01Folder" style="margin-right: 10px;" :disabled = "isGuest" :loading="samplefile_uploadLoading">upload 样本方位图</el-button>
          <input type="file" ref="fileInput01" webkitdirectory multiple @change="handle01Files" style="display: none;" />
          <el-button type="primary" @click="select02Folder" style="margin-right: 10px;" :disabled = "isGuest" :loading="samplefile_uploadLoading">Upload 样本影像图</el-button>
          <input type="file" ref="fileInput02" webkitdirectory multiple @change="handle02Files" style="display: none;" />
          <el-button type="primary" @click="select03Folder" :disabled = "isGuest" :loading="samplefile_uploadLoading">Upload 样本3D标注</el-button>
          <input type="file" ref="fileInput03" webkitdirectory multiple @change="handle03Files" style="display: none;" />
        </div>
        <div class="right-buttons">
          <el-button @click="viewDialogVisible = false">取消</el-button>
          <el-button v-if="!isEdit" type="primary" @click="startEditing" :disabled="isGuest">编辑</el-button>
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
import { ElLoading } from 'element-plus';
import SearchSample from './Search_for_Sample.vue';

export default {
  name: 'SampleInfo',
  components: {
    SearchSample
  },
  props: {
    isGuest: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      snapshot_dialogVisible: false,
      snapshot_imageFiles: [],
      current_samplesnapshot: '',
      samplesnapshot_ImageVisible: false,
      samplefile_downloadLoading: false,
      samplefile_uploadLoading: false,
      current_image_name: '',  // 新增
      searchQuery: {
        sample_source: [],
        patient_ID: []
      },
      sampleInfo: [],
      selectedSamples: [],
      selectAllPages: false,
      addDialogVisible: false,
      viewDialogVisible: false,
      isEdit: false,
      total: 0,
      pageSize: 20,
      currentPage: 1,
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
  watch: {
    searchQuery: {
      handler(newVal) {
        // 当 searchQuery 改变时，重新请求数据
        this.fetchSampleInfo();
      },
      deep: true  // 如果 searchQuery 是个对象/数组，需要 deep 监听
    }
  },
  methods: {
    async viewSampleSnapshot(viewForm) {
      this.snapshot_dialogVisible = true;
      await this.getSampleSnapshot(viewForm);
    },
    async getSampleSnapshot(viewForm) {
      // alert(`${viewForm.idx}`)
      try {
        const response = await axios.post('/api/view_sample_snapshots/', { idx: viewForm.idx });
        this.snapshot_imageFiles = response.data.pics; // 直接使用包含名称和 URL 的对象
      } catch (error) {
        console.error('Error fetching sample snapshots:', error);
        this.snapshot_imageFiles=[];
        this.$message.error('未能获取样本方位图');
      }
    },
    async showImage(imagefile, name) {
      this.current_image_name = name; // 保存当前文件名
      try {
        const response = await axios.post('/api/get_sample_snapshot_url', { imagefile: imagefile },{ responseType: 'blob' });
            // 检查响应是否是 Blob 类型
        if (response.data && response.data instanceof Blob) {
          this.current_samplesnapshot = URL.createObjectURL(response.data);
          this.samplesnapshot_ImageVisible = true; // 打开图像查看对话框

        } else {
          throw new TypeError('Response data is not a Blob');
        }
          } catch (error) {
            console.error('Error fetching image:', error);
            this.$message.error('获取图像失败');
            this.current_samplesnapshot ='';

        }
        this.samplesnapshot_ImageVisible = true; // 打开图像查看对话框
    },
    //****************************样本文件下载函数*******************************
    async download_SampleFiles(row) {
      this.samplefile_downloadLoading = true; // 启动加载动画
      try {
          // 使用 params 传递 row.idx，确保请求为 POST 请求
          const response = await axios.post('/api/sample_download/', {
          idx: row.idx
        }, {
          responseType: 'blob' // 获取 Blob 用于下载文件
        });

        // 创建下载链接
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${row.idx}_${row.sample_id}.zip`); // 设置下载文件名
        document.body.appendChild(link);
        link.click();
        link.remove();

        // 下载成功的消息
        this.$message.success('下载成功');
      } catch (error) {
        console.error('Download failed:', error);
        // 下载失败的消息
        this.$message.error('下载失败');
      }
        finally {
        this.samplefile_downloadLoading = false; // 停止加载动画
      }
    },
    //****************************样本文件上传函数*******************************
    select01Folder() {
      this.$refs.fileInput01.click();
    },
    async handle01Files(event) {
      await this.uploadFiles(event, '/api/Upload_Sample_snapshot', 'fileInput01');
    },
    select02Folder() {
      this.$refs.fileInput02.click();
    },
    async handle02Files(event) {
      await this.uploadFiles(event, '/api/Upload_Sample_image', 'fileInput02');
    },
    select03Folder() {
      this.$refs.fileInput03.click();
    },
    async handle03Files(event) {
      await this.uploadFiles(event, '/api/Upload_Sample_annoation', 'fileInput03');
    },

    async uploadFiles(event, url, inputRef) {
      this.samplefile_uploadLoading = true;
      const sample_idx = this.viewForm.idx;
      const files = event.target.files;
      const formData = new FormData();
      const folderName = files[0].webkitRelativePath.split('/')[0];
      alert(`${folderName}`);

      const BATCH_SIZE = 100; // 每次上传的文件数量

      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batchFiles = Array.from(files).slice(i, i + BATCH_SIZE);
        const batchFormData = new FormData();

        for (let file of batchFiles) {
          batchFormData.append('files', file, file.webkitRelativePath);
        }

        batchFormData.append('folderName', folderName);
        batchFormData.append('sample_idx', sample_idx);

        try {
          const response = await axios.post(url, batchFormData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          console.log('Upload successful:', response.data);
          this.$message.success('上传成功');
        } catch (error) {
          console.error('Error uploading files:', error);
          this.$message.error('上传失败');
        }
      }

      // this.$message.success('上传成功');
      // 重置 input 的值
      this.$refs[inputRef].value = null;
      this.samplefile_uploadLoading = false; // 停止加载动画
    },

    /**
     * 当子组件发出 "search" 事件时被触发
     */
     onSearch(queryParams) {
      // 将子组件传来的查询条件同步到父组件自己的 searchQuery 中
      this.searchQuery.sample_source = queryParams.sample_source || [];
      this.searchQuery.patient_ID = queryParams.patient_ID || [];
      console.log(queryParams)
      // 这一步会触发 watch.searchQuery 从而调用 fetchSampleInfo()
    },
    fetchSampleInfo() {
      const params = {
        skip: (this.currentPage - 1) * this.pageSize,
        limit: this.pageSize,
        sample_source: this.searchQuery.sample_source,
        PID: this.searchQuery.patient_ID,
      };

      axios.get('/api/sample_information/', {
        headers: {
          'Content-Type': 'application/json',
        },
        params: params,
        paramsSerializer: (params) => {
          // 序列化为 FastAPI 支持的格式
          return Object.entries(params)
            .flatMap(([key, value]) =>
              Array.isArray(value)
                ? value.map((v) => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`)
                : `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
            )
            .join('&');
        },
      })
      .then((response) => {
        this.sampleInfo = response.data.data;
        this.total = response.data.total;
      })
      .catch((error) => {
        console.error(error);
        this.$message.error('Failed to load sample information');
      });
    },
        // handleSelectionChange(val) {
    //   if (!this.selectAllPages) {
    //     this.selectedSamples = val;
    //   }
    // },
    handleSelectionChange(val) {
      if (!this.selectAllPages) {
        // 合并当前页选中的数据到 selectedSamples 中
        const selectedIdxs = val.map(item => item.idx);
        this.selectedSamples = this.selectedSamples.filter(item => !selectedIdxs.includes(item.idx)).concat(val);
      }
    },

    handlePageChange(page) {
      this.currentPage = page;
      this.fetchSampleInfo();
    },

    async handleSelectAllPages(value) {  //export 在 line 542
      this.selectAllPages = value;
      if (value) {
        // 显示加载动画
        const loadingInstance = ElLoading.service({
          target: this.$refs.sampleInfo.$el,
          text: '加载中',
          background: 'rgba(255, 255, 255, 0.6)'
        });

        try {
          // 获取所有页的数据
          const allData = await this.fetchAllSampleInfo();
          this.selectedSamples = allData;
          this.sampleInfo = this.sampleInfo.map(row => {
            return { ...row, selected: true };
          });
          this.$refs.sampleInfo.clearSelection();
          this.$nextTick(() => {
            this.$refs.sampleInfo.toggleAllSelection();
          });
        } finally {
          loadingInstance.close();
        }
      } else {
        this.selectedSamples = [];
        this.sampleInfo = this.sampleInfo.map(row => {
          return { ...row, selected: false };
        });
        this.$refs.sampleInfo.clearSelection();
      }
    },

    fetchAllSampleInfo() {
      const params = {
        skip: 0,
        limit: this.total,
        // 两个字段都是数组。例如 ["BJ-TT", "NanJ-NK"]
        sample_source: this.searchQuery.sample_source,
        PID: this.searchQuery.patient_ID
      };
      return axios.get('/api/sample_information/', {
        headers: {
          'Content-Type': 'application/json'
        },
        params: params
      }).then(response => {
        return response.data.data;
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
    // handleSelectionChange(val) {
    //   this.selectedSamples = val;
    // },
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
