<template>
  <div>
    <div class="data-table-container">
      <div class="button-group">
        <el-button type="primary" @click="openAddDialog" :disabled="isGuest">Upload</el-button>
        <el-button @click="exportData" :disabled="isGuest">Export</el-button>
        <el-button @click="exploreSelected" >Explore</el-button>
      </div>
      <!-- <div style="display: flex; align-items: center; margin-bottom: 10px;"> -->
      <!-- <el-checkbox v-model="selectAllPages" @change="handleSelectAllPages">全选</el-checkbox> -->
      <!-- </div> -->
      <el-table ref="dataTable" :data="tableData" style="width: 100%" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="cell_id" label="Cell ID" sortable></el-table-column>
        <el-table-column prop="patient_number" label="Sample ID" sortable></el-table-column>
        <el-table-column prop="tissue_block_number" label="Tissue ID" sortable></el-table-column>
        <el-table-column prop="slice_number" label="Slice ID" sortable></el-table-column>
        <el-table-column prop="small_number" label="小编号" sortable></el-table-column>
        <el-table-column prop="fresh_perfusion" label="新鲜灌注(0:否;1:是)" sortable></el-table-column>
        <el-table-column prop="brain_region" label="脑区" sortable></el-table-column>
        <el-table-column prop="slice_thickness" label="切片厚度(μm)" sortable></el-table-column>
        <el-table-column prop="cell_depth" label="细胞深度(μm)" sortable></el-table-column>
        <el-table-column prop="inject_method" label="Injection (0:Manual;1:Auto)" sortable></el-table-column>
        <el-table-column label="操作" width="160">
          <template v-slot="scope">
            <div class="action-buttons">
              <el-button size="small" type="primary" @click="viewData(scope.row)">View</el-button>
              <el-button size="small" @click="downloadV3DPBD(scope.row)" :loading="downloadLoading">Download</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        background
        layout="prev, pager, next"
        :total="totalItems"
        :page-size="pageSize"
        @current-change="handlePageChange"
      ></el-pagination>
    </div>

    <!-- Dialog for adding data -->
    <el-dialog title="Upload Data" v-model="addDialogVisible" @open="setDefaultValues" width="74%">
      <el-form ref="addForm" :model="form" label-width="240px" class="custom-dialog-content">
        <!-- 单独的 Cell ID 行 -->
        <el-row justify="center" class="cell-id-row">
          <el-col :span="12" class="cell-id-col">
            <el-form-item label="Cell ID" label-width="50%" class="custom-form-item cell-id-item">
              <el-input 
                v-model="form.cell_id" 
                :style="{ color: isDefaultValue.cell_id ? 'gray' : 'black', fontWeight: 'bold' }"
                @input="handleInput('cell_id')"
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <div v-for="(section, sectionKey) in formSections" :key="sectionKey" class="form-section">
          <el-divider></el-divider>
          <h3>{{ section.title }}</h3>
          <el-row :gutter="20">
            <el-col :span="6" v-for="(item, index) in section.items" :key="index">
              <el-form-item 
              :label="item.label" class="custom-form-item"
              :class="{'custom-form-item': true, 'highlight-label': ['Document Name', 'overlap'].includes(item.prop)}"
              >
                <el-input 
                  v-model="form[item.prop]" 
                  :style="{ color: isDefaultValue[item.prop] ? 'gray' : 'black' }"
                  @input="handleInput(item.prop)"
                ></el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">上传</el-button>
      </div>
    </el-dialog>

    <!-- Dialog for viewing and editing data -->
    <el-dialog title="View Data" v-model="viewDialogVisible" width="74%">
      <el-form ref="viewFormRef" :model="viewForm" label-width="240px" class="custom-dialog-content">
        <!-- 显示图像 -->
        <div v-if="viewForm.image_file" class="image-container">
          <img 
            v-if="imageUrl" 
            :src="imageUrl" 
            alt="Image" class="image-preview" 
            style="width: 12%;" 
            @dblclick="showFullImage(viewForm.image_file)">
          <div class="image-label">MIP</div>
        </div>
        <!-- 单独的 Cell ID 行 -->
        <el-row justify="center" class="cell-id-row">
          <el-col justify="center":span="7" class="cell-id-col">
            <el-form-item label="Cell ID" label-width="45%" class="custom-form-item cell-id-item">
              <el-input 
                v-model="viewForm.cell_id" 
                :readonly="!isEdit"
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <div v-for="(section, sectionKey) in formSections" :key="sectionKey" class="form-section">
          <el-divider></el-divider>
          <h3>{{ section.title }}</h3>
          <el-row :gutter="20">
            <el-col :span="6" v-for="(item, index) in section.items" :key="index">
              <el-form-item :label="item.label":prop="item.prop">
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
          <el-button v-if="!isEdit" type="primary" @click="startEditing" :disabled="isGuest">编辑</el-button>
          <el-button v-if="isEdit" type="primary" @click="submitEdit">保存</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- Full-size image dialog -->
    <el-dialog title="Full Size Image" v-model="fullImageDialogVisible" width="28%">
      <img :src="fullImageUrl" alt="Full Size Image" style="width: 100%; height: auto;">
    </el-dialog>

    <!-- Dialog for delete confirmation -->
    <el-dialog title="确认删除" v-model="deleteDialogVisible">
      <span>你确定要删除这条数据吗？</span>
      <div slot="footer" class="dialog-footer">
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="deleteData">确认</el-button>
      </div>
    </el-dialog>
  </div>
</template>


<script>
import axios from '@/axios';
import * as XLSX from 'xlsx';
import { reactive,toRaw } from 'vue';

export default {
  name: 'DataTable',
  props: {
    searchQuery: {
      type: Object,
      default: () => ({})
    },
    isGuest: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      tableData: [],
      totalItems: 0,
      pageSize: 20,
      currentPage: 1,
      addDialogVisible: false,
      viewDialogVisible: false,
      deleteDialogVisible: false,
      isEdit: false, // 确保 isEdit 被初始化
      deleteRow: null,
      selectedRows: reactive([]), // 全局的选中行数据数组
      selectAllPages: false, 
      fullImageDialogVisible: false,
      imageUrl:'',
      fullImageUrl: '',
      downloadLoading: false,
      form: this.getEmptyForm(),
      viewForm: this.getEmptyForm(),
      formSections: {
        // cellID:{
        //   title: '',
        //   items: [
        //     { label: 'Cell ID', prop: 'cell_id' },
        //   ]
        // }, 
        sampleInfo:{
          title: '样本信息',
          items: [
            // { label: 'Cell ID', prop: 'cell_id' },
            // { label: 'Tissue ID', prop: 'tissue_id' },
            // { label: 'Slice ID', prop: 'slice_id' },
            { label: '病人编号', prop: 'patient_number' },
            { label: '组织块编号', prop: 'tissue_block_number' },
            { label: '小编号', prop: 'small_number' },
            { label: '切片编号', prop: 'slice_number' },
            // { label: 'confirmed', prop: 'comfirmed' },
            { label: '切片方式(0:振动切片;1:冰冻切片)', prop: 'slicing_method' },
            { label: '切片与固定顺序(0:先固定;1:先切片)', prop: 'slicing_and_fixation_order' },
            { label: '切片前固定天数', prop: 'pre_fixation_days' },
            { label: '切片后固定天数', prop: 'post_fixation_days' },
            { label: '脑区', prop: 'brain_region' },
            { label: '切片厚度(微米)', prop: 'slice_thickness' },
            { label: '样本制备人员', prop: 'sample_preparation_staff' },
            { label: '样本制备日期', prop: 'sample_preparation_date' },
            { label: '新鲜灌注(0:否;1:是)', prop: 'fresh_perfusion' },
            { label: '4%多聚甲醛固定后灌注(0:否;1:是)', prop: 'post_perfusion_4percent_pfa' },
            { label: '10%甲醛固定后灌注(0:否;1:是)', prop: 'post_perfusion_10percent_formalin' },
            { label: 'confirmed', prop: 'comfirmed_0' }
          ]
        },
        perfusionInfo:{
          title: '灌注信息',
          items: [
            { label: '组织离体时间', prop: 'tissue_dissection_time' },
            { label: '灌注开始时间(e.g.14:30)', prop: 'perfusion_start_time' },
            { label: '灌注结束时间(e.g.18:30)', prop: 'perfusion_end_time' },
            { label: 'after surgery(h)', prop: 'after_surgery_hours' },
            { label: '* 细胞深度(微米)', prop: 'cell_depth' }, //
            { label: '* 灌注电流(nA)', prop: 'perfusion_current' },  //
            { label: '* 灌注时间(通电,mins)', prop: 'perfusion_time_on' }, //
            { label: '灌注时间(未通电,mins)', prop: 'perfusion_time_off' },
            { label: '实验温度(℃)', prop: 'experiment_temperature' },
            { label: '实验湿度(%RH)', prop: 'experiment_humidity' },
            { label: '染料(LY)浓度(%)', prop: 'dye_concentration' },
            { label: 'Manual/Auto Inject(0:Manual;1:Auto)', prop: 'inject_method' },
            { label: '灌注日期', prop: 'perfusion_date' },
            { label: '灌注人员', prop: 'perfusion_staff' }
          ]
        },
        ihcInfo:{
          title: '免疫组化',
          items: [
            { label: 'Lucifer yellow免疫染色(0:否;1:是)', prop: 'lucifer_yellow_immunohistochemistry' },
            { label: 'Anti-Lucifer yellow 浓度', prop: 'anti_lucifer_yellow_concentration' },
            { label: '二抗波段', prop: 'secondary_antibody_band' },
            { label: 'DAPI浓度', prop: 'dapi_concentration' }
          ]
        },
        shootingInfo:{
          title: '拍摄信息',
          items: [
            { label: '激光波长(nm)', prop: 'laser_wavelength' },
            { label: '激光功率(mW)', prop: 'laser_power' }, 
            { label: '* 激光功率比例(%)', prop: 'laser_power_ratio' },  // 
            { label: '* PMT(V)', prop: 'pmt_voltage' },  // 
            { label: '* Z_size(张)', prop: 'z_size' },  // 
            { label: '* 平铺(0:否;1:是)', prop: 'tiling' },  //
            { label: 'overlap', prop: 'overlap' },
            { label: '* xy拍摄分辨率(*10e-3μm/px)', prop: 'xy_resolution' },  //
            { label: 'z拍摄分辨率(*10e-3μm/px)', prop: 'z_resolution' },
            { label: '* Document Name', prop: 'document_name' },  //
            { label: '* Image Cell ID', prop: 'image_cell_id' },  //
            { label: '拍摄日期', prop: 'shooting_date' },
            { label: '拍摄人员', prop: 'shooting_staff' },
            { label: 'confirmed', prop: 'confirmed_1' }
          ]
        },
        reconstructionInfo:{
          title: '重建信息',
          items: [
            { label: '重建人员', prop: 'reconstruction_staff' },
            { label: 'status_0', prop: 'status' },
            { label: '检查人员', prop: 'inspection_staff' },
            { label: 'status_1', prop: 'status_0' }
          ]
        },
        sealingInfo:{
          title: '封片信息',
          items: [
            { label: '是否封片', prop: 'sealed_slide' },
            { label: 'status', prop: 'status_1' }
          ]
        }
      },
      isDefaultValue: {}  // 初始化 isDefaultValue
    };
  },
  watch: {
    searchQuery: {
      handler() {
        this.fetchData();
      },
      deep: true,
      immediate: true
    },
    viewDialogVisible(val) {
      if (val) {
        this.showImage();
      }
    }
  },

  methods: {
    fetchData() {
      let that = this
      const params = {
        skip: (this.currentPage - 1) * this.pageSize,
        limit: this.pageSize,
        ...this.searchQuery
      };
      axios.get('/api/singlecell/', {
        headers: {
          'Content-Type': 'application/json'
        },
        params: params
      })
      .then(response => {
        this.tableData = response.data.data;  // 获取 data 数组
        this.totalItems = response.data.total;  // 获取 total 数量
        const sr = this.selectedRows;
        // 恢复选中状态
        this.$nextTick(() => {
          this.selectedRows = sr;
          this.selectedRows.forEach(selectedRow => {
            const rawSelectedRow = toRaw(selectedRow);
            const row = this.tableData.find(row => toRaw(row).cell_id === rawSelectedRow.cell_id);
            if (row) {
              console.log('Restoring selection for row:', row);
              this.$refs.dataTable.toggleRowSelection(row, true);
            } else {
              console.log('Row not found for cell_id:', rawSelectedRow.cell_id);
            }
          });
        });
      })
      .catch(error => {
        console.error(error);
      });
    },
    handleSelectionChange(val) {
      // 先保存当前页的选中行
      const pageRows = this.tableData.map(row => row.cell_id);
      // 移除当前页中未选中的行
      this.selectedRows = this.selectedRows.filter(row => !pageRows.includes(row.cell_id));
      // 添加当前页中选中的行
      this.selectedRows.push(...val.map(row => toRaw(row)));
    },
    handlePageChange(page) {
      this.currentPage = page;
      this.fetchData();
    },

    openAddDialog() {
      this.addDialogVisible = true;
    },
    setDefaultValues() {
      axios.get('/api/defaultvalues/', {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        Object.assign(this.form, response.data.last_record);
        this.form.cell_id = response.data.cell_id;
        this.isDefaultValue = {}; // 清空上次的默认值状态
        for (const key in this.form) {
          if (this.form[key]) {
            this.isDefaultValue[key] = true;
          }
        }
      })
      .catch(error => {
        console.error(error);
      });
    },
    handleInput(prop) {
      this.isDefaultValue[prop] = false;
    },

    submitForm() {
      // this.loading = true;
      axios.post('/api/singlecell/', this.form)
      .then(response => {
        this.tableData.push(response.data);
        this.fetchData();
        this.addDialogVisible = false;
        // this.loading = false;
        this.$message.success('数据新增成功');
      })
      .catch(error => {
        console.error(error);
        // this.loading = false;
        this.$message.error('数据新增失败');
      });
    },
    viewData(row) {
      this.viewForm = { ...row };
      this.isEdit = false;
      this.viewDialogVisible = true;
    },

    // getImageUrl(imagePath) {
    //   return `http://10.192.34.220:8000/api/image/${imagePath}`;
    // },
    async getImageUrl(imagePath) {
      try {
        const response = await axios.get(`/api/image/${imagePath}`, { responseType: 'blob' });
        const imageUrl = URL.createObjectURL(response.data);
        return imageUrl;
      } catch (error) {
        console.error('Error fetching image:', error);
        this.$message.error('获取图像失败');
        return '';
      }
    },
    async showImage() {
      if (this.viewForm.image_file) {
        this.imageUrl = await this.getImageUrl(this.viewForm.image_file);
      }
    },
    
    async showFullImage(imagePath) {
      this.fullImageUrl = await this.getImageUrl(imagePath);
      this.fullImageDialogVisible = true;
    },
    startEditing() {
      this.isEdit = true;
    },
    submitEdit() {
      axios.put(`/api/singlecell/${this.viewForm.cell_id}`, this.viewForm, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        this.fetchData();
        this.viewDialogVisible = false;
        this.$message.success('数据更新成功');
      })
      .catch(error => {
        console.error(error);
        this.$message.error('数据更新失败');
      });
    },
    confirmDelete() {
      this.deleteDialogVisible = true;
    },
    deleteData() {
      axios.delete(`/api/singlecell/${this.viewForm.cell_id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        this.fetchData();
        this.deleteDialogVisible = false;
        this.viewDialogVisible = false;  // 关闭查看对话框
        this.$message.success('数据删除成功');
      })
      .catch(error => {
        console.error(error);
        this.deleteDialogVisible = false;
        this.$message.error('数据删除失败');
      });
    },
    async downloadV3DPBD(row) {
      if (!row.v3dpbd_file) {
        console.error('v3dpbd_file is undefined');
        this.$message.error('无此图像文件');
        return;
      }
      const filePath = row.v3dpbd_file; // 获取文件路径
      const cellId = row.cell_id; // 获取 cell_id
      // 构建下载 URL downloadUrl, 包括编码后的 filePath 和 cell_id 作为查询参数
      const downloadUrl = `/api/download?file_path=${encodeURIComponent(filePath)}&cell_id=${cellId}`;

      console.log(filePath);
      console.log(`Downloading from URL: ${downloadUrl}`);
      this.downloadLoading = true; // 启动加载动画
      // 发送下载请求
      try {
        const response = await axios({
          url: downloadUrl,
          method: 'GET',
          responseType: 'blob', // 确保接收的是二进制文件流
        });
        // 处理响应
        if (response.status === 200) {
          console.log('Response:', response);
          // 创建一个新的 Blob 对象, 包含响应数据, 并设置其 MIME 类型。
          const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' });
          // 使用 window.URL.createObjectURL(blob) 创建一个 URL, 用于指向生成的 Blob 对象。
          const url = window.URL.createObjectURL(blob);
          // 创建一个 a 元素, 并将其 href 属性设置为生成的 URL。
          const link = document.createElement('a');
          link.href = url;
          // 根据响应的 Content-Type 头判断下载文件的类型, 设置下载的文件名
          if (response.headers['content-type'] !== 'application/zip') {
            link.setAttribute('download', filePath.split('/').pop()); // .v3dpbd 文件
          } else {
            link.setAttribute('download', `${cellId}.zip`);  // 使用 cellId 命名 zip 文件
          }

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url); // 释放内存
        } else {
          console.error('Error downloading file:', response.statusText);
          this.$message.error('下载文件失败');
        }
      } catch (error) {
        console.error('Error details:', error); // 打印错误细节
        if (error.response) {
          // 请求已发出，但服务器响应了状态码不在2xx范围内
          console.error('Error downloading file:', error.response.status, error.response.statusText);
          this.$message.error(`下载文件失败：${error.response.statusText}`);
        } else if (error.request) {
          // 请求已发出但未收到响应
          console.error('Error downloading file:', error.request);
          this.$message.error('下载文件失败，未收到服务器响应');
        } else {
          // 其他错误
          console.error('Error downloading file:', error.message);
          this.$message.error('下载文件失败：' + error.message);
        }
      } finally {
        this.downloadLoading = false; // 停止加载动画
      }
    },
    exportData() {
      if (this.selectedRows.length === 0) {
        this.$message.warning('请选择要导出的数据');
        return;
      }
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(this.selectedRows);
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      XLSX.writeFile(wb, 'export.xlsx');
    },
    exploreSelected() {
      if (this.selectedRows.length > 0) {
        this.$router.push({
          name: 'DataExplorer',
          query: {
            selectedData: JSON.stringify(this.selectedRows)
          }
        });
      } else {
        this.$message.warning('请选择至少一条数据进行探索');
      }
    },
    getEmptyForm() {
      return {
        image_file: '',
        cell_id: '',
        tissue_id: '',
        slice_id: '',
        patient_number: '',
        tissue_block_number: '',
        small_number: '',
        slice_number: '',
        comfirmed: '',
        slicing_method: '',
        slicing_and_fixation_order: '',
        pre_fixation_days: '',
        post_fixation_days: '',
        sample_preparation_staff: '',
        sample_preparation_date: '',
        fresh_perfusion: '',
        post_perfusion_4percent_pfa: '',
        post_perfusion_10percent_formalin: '',
        brain_region: '',
        slice_thickness: '',
        comfirmed_0: '',
        tissue_dissection_time: '',
        perfusion_start_time: '',
        perfusion_end_time: '',
        after_surgery_hours: '',
        cell_depth: '',
        perfusion_current: '',
        perfusion_time_on: '',
        perfusion_time_off: '',
        dye_concentration: '',
        experiment_temperature: '',
        experiment_humidity: '',
        inject_method: '',
        perfusion_date: '',
        perfusion_staff: '',
        lucifer_yellow_immunohistochemistry: '',
        anti_lucifer_yellow_concentration: '',
        secondary_antibody_band: '',
        dapi_concentration: '',
        laser_wavelength: '',
        laser_power: '',
        laser_power_ratio: '',
        pmt_voltage: '',
        z_size: '',
        tiling: '',
        overlap: '',
        xy_resolution: '',
        z_resolution: '',
        document_name: '',
        image_cell_id: '',
        shooting_date: '',
        shooting_staff: '',
        confirmed: '',
        reconstruction_staff: '',
        status: '',
        inspection_staff: '',
        status_0: '',
        sealed_slide: '',
        status_1: ''
      };
    }
  }
};
</script>

<style scoped>
.default-value {
  color: gray;
}

.data-table-container {
  margin-top: 25px;
}
.button-group {
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
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


.el-dialog {
  z-index: 2000 !important;
  position: fixed !important;
  top: 50px !important; /* 确保对话框不会在视窗外 */
}

.custom-dialog-content {
  padding-left: 20px;
  padding-right: 30px; /* 右边距 */
}

.cell-id-row {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  margin-bottom: 20px; /* 添加间距使其与下面的内容分开 */
}

/* .cell-id-col {
  display: flex;
  justify-content: center;
}

.cell-id-item .el-form-item__content {
  display: flex;
  justify-content: center;
} */

.cell-id-col .el-input {
  max-width: 45%; /* 设置输入框的最大宽度 */
  font-weight: bold; /* 内容加粗 */
}

.cell-id-item .el-form-item__label {
  font-weight: bold; /* 标签加粗 */
}

.section-title {
  font-size: 18px; /* 调整部分标题的字体大小 */
  font-weight: bold; /* 使标题更显眼 */
  text-align: center; /* 标题居中 */
}

.el-form-item {
  margin-bottom: 10px;
}

.custom-form-item .el-form-item__label {
  font-size: 40px; /* 调整标签的字体大小 */
  font-weight: bold; /* 使标签更显眼 */
}

.highlight-label .el-form-item__label {
  color: red !important; /* 特定标签显示为红色 */
}

.el-form-item__label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.form-section {
  margin-bottom: 20px;
}

.dialog-footer {
  text-align: right;
}

.image-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}
.image-preview {
  cursor: pointer;
  transition: transform 0.3s;
}
.image-preview:hover {
  transform: scale(1.1);
}
.image-label {
  margin-top: 5px;
  font-weight: bold;
}
/* .full-image-preview {
  width: 100%;
} */
</style>