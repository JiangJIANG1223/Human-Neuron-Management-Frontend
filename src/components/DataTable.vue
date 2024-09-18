<template>
  <div>
    <div class="data-table-container">
      <div class="button-group">
        <div class="left-buttons">
          <el-button type="primary" @click="openAddDialog" :disabled="isGuest">Upload</el-button>
          <el-button @click="exportData" :disabled="isGuest">Export</el-button>
          <el-button @click="exploreSelected" >Explore</el-button>
        </div>
        <div class="right-buttons">
          <el-button type="primary" @click="openRecordBookDialog">Record Book</el-button>
        </div>
      </div>
      <div class="select-all-container" style="display: flex; align-items: center; margin-top: 30px; margin-bottom: -8px; padding-left: 13px;">
        <el-checkbox v-model="selectAllPages" @change="handleSelectAllPages"> Select All Pages </el-checkbox>
      </div>
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
        <el-table-column label="操作" width="180">
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
                :label="item.label" 
                class="custom-form-item"
              >
              <component
                :is="getComponentType(item.prop)"
                v-model="form[item.prop]"
                :filterable="isFilterable(item.prop)"
                :allow-create="isAllowCreate(item.prop)"
              >
                <el-option 
                  v-if="item.prop === 'fresh_perfusion' || item.prop === 'post_perfusion_4percent_pfa' || item.prop === 'post_perfusion_10percent_formalin' || item.prop === 'inject_method' || item.prop === 'immunohistochemistry' || item.prop === 'tiling'"
                  v-for="option in [{value: 0, label: '0'}, {value: 1, label: '1'}]" 
                  :key="option.value" 
                  :label="option.label" 
                  :value="option.value"
                ></el-option>
                
                <el-option 
                  v-if="item.prop === 'image_size'"
                  v-for="option in ['512*512', '1048*1048', '2048*2048']" 
                  :key="option" 
                  :label="option" 
                  :value="option"
                ></el-option>

                <el-option 
                  v-if="item.prop === 'after_surgery_hours'"
                  v-for="option in [
                                    '-', '1hAFTsur', '2hAFTsur', '3hAFTsur', '4hAFTsur', '5hAFTsur', 
                                    '6hAFTsur', '7hAFTsur', '8hAFTsur', '9hAFTsur', '10hAFTsur', 
                                    '1dAFTsur', '2dAFTsur'
                                    ]" 
                  :key="option" 
                  :label="option" 
                  :value="option"
                ></el-option>

                <el-option 
                  v-if="item.prop === 'dye_name' || item.prop === 'ihc_category'"
                  v-for="option in [
                                    'Lucifer Yellow', 'Cascade Blue'
                                    ]" 
                  :key="option" 
                  :label="option" 
                  :value="option"
                ></el-option>
                <el-option 
                  v-if="item.prop === 'brain_region'"
                  v-for="option in brainRegionOptions" 
                  :key="option.value" 
                  :label="option.label" 
                  :value="option.value"></el-option>
              </component>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="uploadLoading">上传</el-button>
      </div>
    </el-dialog>

    <!-- Dialog for viewing and editing data -->
    <el-dialog title="View Data" v-model="viewDialogVisible" width="74%">
      <el-form ref="viewFormRef" :model="viewForm" label-width="240px" class="custom-dialog-content">
        <!-- 显示图像 -->
            <div style="display: flex; justify-content: center;">
                <div style="display: flex; align-items: center; justify-content: center;">

                    <!-- Always show MIP -->
                    <div v-if="viewForm.image_file" class="image-container" style="margin: 3px;">
                        <img :src="imageUrl" alt="mip Image" style="width: 70%;" class="image-preview" @dblclick="showFullImage(viewForm.image_file)"/>
                        <div class="image-label">MIP</div>
                    </div>

                    <!-- Initially show Both -->
                    <div class="image-container" style="margin: 3px;">
                        <img v-show="currentImage === 'both'" :src="mip_swc_url" alt="Both Image" style="width: 70%;" class="image-preview" @dblclick="showFullBoth(viewForm.image_file, viewForm)"/>
                        <img v-show="currentImage === 'swc'" :src="swcUrl" alt="SWC Image" style="width: 70%;" class="image-preview" @dblclick="showFullSWC(viewForm)"/>
                        <div class="image-label">{{ currentImageLabel }}</div>

                        <!-- View/Hide SWC Button -->
                        <el-button type="primary" @click="toggleImage" style="position: absolute; top: 120px; right: 5px;">{{ buttonLabel }}</el-button>

                        <!-- Dropdown -->
                        <select v-model="selectedVersion" @change="updateSwcUrl" class="custom-select" style="position: absolute; top: 160px; right: 5px;">
                            <option value="v0">Auto_1.4</option>
                            <option value="v1">其它版本未上线1</option>
                            <option value="v2">其它版本未上线2</option>
                        </select>
                    </div>



                </div>
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
          <div>
              <el-button type="primary" @click="triggerFileInput" style="margin-right: 10px;">Upload 3D Image</el-button>
              <input type="file" ref="fileInput" @change="handleFileChange" style="display: none;" />
          </div>
	    <el-button type="primary" @click="select2DFolder">Upload 2D Image</el-button>
            <input type="file" ref="fileInput2D" webkitdirectory multiple @change="handleFiles" style="display: none;" />
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

    <!-- Dialog for Record Book -->
    <el-dialog title="Record Book" v-model="recordBookDialogVisible" width="50%">
      <el-upload
        list-type="picture"
        :before-upload="uploadImage"
        :file-list="fileList">
        <el-button size="small" type="primary">Upload Pic</el-button>
      </el-upload>
      <el-table :data="recordBookPics" style="width: 100%">
        <el-table-column prop="name" label="File Name" width="180">
          <template v-slot="scope">
            <el-link type="primary" @click="handlePictureCardPreview(scope.row)">
              {{ scope.row.name }}
            </el-link>
          </template>
        </el-table-column>
      </el-table>
      <el-dialog title="Preview Image" v-model="previewDialogVisible" width="50%">
        <img width="100%" :src="previewImageUrl" alt="">
      </el-dialog>
    </el-dialog>
  </div>
</template>


<script>
import axios from '@/axios';
import * as XLSX from 'xlsx';
import { reactive,toRaw } from 'vue';
import { ElLoading } from 'element-plus';

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

      selectedVersion: 'v0', // 默认选择
      swcUrlv0:'',// 默认版本SWC图像的URL
      swcUrlv1: '', // v1 版本的 URL
      swcUrlv2: '', // v2 版本的 URL

      mip_swc_urlv0:'', //展示默认版本的MIP—SWC图像用
      mip_swc_urlv1:'', //展示MIP—SWC图像用
      mip_swc_urlv2:'', //展示MIP—SWC图像用


      currentImage: 'both', // 初始显示Both，MIP和Both交替展示用
      folderPath: '', // 批量化转换用

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
      swcUrl:'',   //展示SWC图像用
      mip_swc_url:'', //展示MIP—SWC图像用
      fullImageUrl: '',
      uploadLoading: false,
      downloadLoading: false,
      form: this.getEmptyForm(),
      viewForm: this.getEmptyForm(),
      formSections: {
        sampleInfo:{
          title: '样本信息',
          items: [
            { label: '病人编号', prop: 'patient_number' },
            { label: '组织编号', prop: 'tissue_block_number' },
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
            { label: '* 灌注开始时间(e.g.14:30)', prop: 'perfusion_start_time' },
            { label: '* 灌注结束时间(e.g.18:30)', prop: 'perfusion_end_time' },
            { label: '* after surgery(h)', prop: 'after_surgery_hours' },
            { label: '* 细胞深度(微米)', prop: 'cell_depth' }, //
            { label: '* 灌注电流(nA)', prop: 'perfusion_current' },  //
            { label: '* 灌注时间(通电,mins)', prop: 'perfusion_time_on' }, //
            { label: '灌注时间(未通电,mins)', prop: 'perfusion_time_off' },
            { label: '实验温度(℃)', prop: 'experiment_temperature' },
            { label: '实验湿度(%RH)', prop: 'experiment_humidity' },
            { label: '染料名称', prop: 'dye_name' },
            { label: '染料浓度(%)', prop: 'dye_concentration' },
            { label: 'Manual/Auto Inject(0:Manual;1:Auto)', prop: 'inject_method' },
            { label: '灌注日期', prop: 'perfusion_date' },
            { label: '灌注人员', prop: 'perfusion_staff' }
          ]
        },
        ihcInfo:{
          title: '免疫组化',
          items: [
            { label: '类别', prop: 'ihc_category' },
            { label: '免疫染色(0:否;1:是)', prop: 'immunohistochemistry' },
            { label: '一抗浓度', prop: 'first_antibody_concentration' },
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
            { label: 'Image Size', prop: 'image_size' }, ////
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
      // isDefaultValue: {}, // 初始化 isDefaultValue
      brainRegionOptions: [],

      recordBookDialogVisible: false,
      previewDialogVisible: false,
      previewImageUrl: '',
      fileList: [],
      recordBookPics: []
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
  // 为MIP和Both交替可视化进行设置
  computed: {
        buttonLabel() {
            return this.currentImage === 'both' ? 'View SWC' : 'View Both';
        },
        currentImageLabel() {
            return this.currentImage === 'both' ? 'Both' : 'SWC';
        },

  },
  mounted() {
    this.fetchOptions();
  },
  methods: {
  //**************************2D 图像上传拼接用***************************
    select2DFolder() {
      this.$refs.fileInput2D.click();
    },

    async handleFiles(event) {
      const files = event.target.files;
      const formData = new FormData();

      // 获取文件夹名称，假设文件的路径格式为 "folderName/fileName.ext"
      const folderName = files[0].webkitRelativePath.split('/')[0]; // 获取第一个文件的相对路径中的文件夹名称

      // 将文件夹名称添加到 FormData
      formData.append('folderName', folderName);

      for (let file of files) {
        if (file.name.endsWith('.tif') || file.name.endsWith('.png')) {
          formData.append('files', file);
        }
      }

      try {
        const response = await fetch('/api/2Dupload/', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Upload successful:', result);
          this.$message.success('上传成功');
        } else {
          console.error('Upload failed:', response.statusText);
          this.$message.error('上传失败1');
        }
      } catch (error) {
        console.error('Error uploading files:', error);
        this.$message.error('上传失败2');
      } finally {
        // 重置 input 的值
        this.$refs.fileInput.value = null;
      }
    },

  //**************************2D 图像上传拼接用，结束**********************
   //**********************多版本SWC展示用********************************
    updateSwcUrl() {
    if (this.selectedVersion === 'v0')
    {
      if(this.viewForm.swc_auto14)
          {this.swcUrl = this.swcUrlv0;
           this.mip_swc_url = this.mip_swc_urlv0;} // 使用默认的 SWC URL,swcUrl是最终用到的展示路径
      else
          {this.swcUrl = '';
           this.mip_swc_url = '';}
    }
    else if (this.selectedVersion === 'v1')
    {
      if(this.viewForm.swc_v1)
          {this.swcUrl = this.swcUrlv1;
           this.mip_swc_url = this.mip_swc_urlv1;} // 使用默认的 SWC URL,swcUrl是最终用到的展示路径
      else
          {this.swcUrl='';
           this.mip_swc_url = '';}

    }
     else if (this.selectedVersion === 'v2')
    {
      if(this.viewForm.swc_v2)
          {this.swcUrl = this.swcUrlv2;
           this.mip_swc_url = this.mip_swc_urlv2;} // 使用默认的 SWC URL,swcUrl是最终用到的展示路径
      else
          {this.swcUrl='';
           this.mip_swc_url = '';}
    }
  },
   //***********************MIP-SWC可视化********************************
   toggleImage() {
            this.currentImage = this.currentImage === 'both' ? 'swc' : 'both';
     },
   //*************************MIP-SWC可视化***************************
//**************************单样本数据格式转换上传部分代码*************************************
    triggerFileInput() {
          this.$refs.fileInput.click();
        },
        async handleFileChange(event) {
          const file = event.target.files[0];
          if (file) {
            const formData = new FormData();
            formData.append('file', file);
            alert(`${file}`)

            try {
              const response = await fetch('/api/singleConvert/', {
                method: 'POST',
                body: formData,
              });
              if (response.ok) {
                alert('文件上传成功');
              } else {
                alert('文件上传失败');
              }
            } catch (error) {
              console.error('Error during file upload:', error);
              this.$message.error('文件转换失败');
            }
             finally {
                // 重置 input 的值
                this.$refs.fileInput.value = null;}
          }
        },
     //**********************************单样本数据格式转换上传部分代码结束*************************************
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

    async handleSelectAllPages(value) {
      this.selectAllPages = value;
      if (value) {
        // 显示加载动画
        const loadingInstance = ElLoading.service({
          target: this.$refs.dataTable.$el,  // 将加载动画显示在表格上
          text: '加载中',
          background: 'rgba(255, 255, 255, 0.6)'  // 设置遮罩的背景颜色和透明度
        });

        try {
          // 选择所有页的数据
          const allData = await this.fetchAllData();
          this.selectedRows = allData;
          this.tableData = this.tableData.map(row => {
            return { ...row, selected: true };  // 更新数据中的选中状态
          });
          this.$refs.dataTable.clearSelection();
          this.$nextTick(() => {
            this.$refs.dataTable.toggleAllSelection();
          });
        } finally {
          // 关闭加载动画
          loadingInstance.close();
        }
      } else {
        // 清空选择
        this.selectedRows = [];
        this.tableData = this.tableData.map(row => {
          return { ...row, selected: false };  // 更新数据中的选中状态
        });
        this.$refs.dataTable.clearSelection();
      }
    },
    fetchAllData() {
      // 获取所有页的数据的逻辑，可能需要分页请求所有数据并合并
      return axios.get('/api/singlecell/', {
        headers: {
          'Content-Type': 'application/json'
        },
        params: {
          ...this.searchQuery,
          limit: this.totalItems,  // 获取所有数据
          skip: 0
        }
      }).then(response => {
        return response.data.data;  // 返回所有数据
      });
    },
    handleSelectionChange(val) {
      if (!this.selectAllPages) {
        // 先保存当前页的选中行
        const pageRows = this.tableData.map(row => row.cell_id);
        // 移除当前页中未选中的行
        this.selectedRows = this.selectedRows.filter(row => !pageRows.includes(row.cell_id));
        // 添加当前页中选中的行
        this.selectedRows.push(...val.map(row => toRaw(row)));
      }
    },
    selectable(row) {
      return row.selected;  // 通过 row 的 selected 属性控制选中状态
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
      })
      .catch(error => {
        console.error(error);
      });
    },
    getComponentType(prop) {
      const selectProps = [
        'brain_region', 
        'fresh_perfusion', 'post_perfusion_4percent_pfa', 'post_perfusion_10percent_formalin',

        'after_surgery_hours', 'dye_name',
        'inject_method', 

        'ihc_category', 
        'immunohistochemistry',

        'image_size',
        'tiling', 
      ];
      return selectProps.includes(prop) ? 'el-select' : 'el-input';
    },
    isFilterable(prop) {
      return ['brain_region', 'after_surgery_hours', 'dye_name', 'ihc_category', 'image_size'].includes(prop);
    },
    isAllowCreate(prop) {
      return ['brain_region', 'image_size', 'after_surgery_hours'].includes(prop);
    },
    fetchOptions() {
      axios.get('/api/get-options')  // 明确指定后端路径
        .then(response => {
          this.brainRegionOptions = response.data.brain_region_options;
        })
        .catch(error => {
          console.error('Error fetching options:', error);
        })
    },
    submitForm() {
      this.uploadLoading = true;
      axios.post('/api/singlecell/', this.form)
      .then(response => {
        this.tableData.push(response.data);
        this.fetchData();
        this.addDialogVisible = false;
        this.uploadLoading = false;
        this.$message.success('数据新增成功');
      })
      .catch(error => {
        console.error(error);
        this.uploadLoading = false;
        this.$message.error('数据新增失败');
      });
    },
    viewData(row) {

        this.viewForm = { ...row };
        this.selectedVersion = 'v0';
        this.currentImage = 'both';

        // 先获取 URL
        Promise.all([
            this.getImageUrl2(row.image_file, row.swc_auto14,row.cell_id).then(url => {
                this.mip_swc_url = url;
            }),
            this.getImageUrl1(row.swc_auto14,row.image_file,row.cell_id).then(url => {
                this.swcUrl = url;
            })
        ]).catch(error => {
            console.error('Error fetching images:', error);
        });


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
    async getImageUrl1(ss,mipforswc,cellid) {  //获取SWC图像的,ss是传入的不同版本的swc文件地址

    if(!ss){
        this.$message.error('No SWC file');
        return '';

    }

      try {
       const response = await axios.post('/api/getSWC/', {
                   ss:ss,  // 将文件夹路径发送到后端
                   mipforswc:mipforswc,
                   cellid:cellid
                  }, {
                     responseType: 'blob' // 这里设置为 blob
                   });
        const swcUrl = URL.createObjectURL(response.data);
        return swcUrl;
      } catch (error) {
        console.error('Error fetching image:', error);
        this.$message.error('获取图像失败1');
        return '';
      }
    },
    async getImageUrl2(imageFile, swcFile,cellid) { //获取MIP和SWC图像叠加图的
      if(!imageFile || !swcFile)
      {
            return '';
      }

      try {
        const response = await axios.post('/api/getMIPSWC/', {
          image_file: imageFile,  // 将image_file发送到后端
          swc_file: swcFile,      // 将swc_auto14发送到后端
          cellid:cellid

        }, {
          responseType: 'blob' //
        });

        const mip_swc_url = URL.createObjectURL(response.data);
        return mip_swc_url;  // 返回生成的URL

      } catch (error) {
        console.error('Error fetching combined image:', error);
        this.$message.error('获取图像失败2');
        return '';
      }
    },
    async showImage() {
      if (this.viewForm.image_file) {
            this.imageUrl = await this.getImageUrl(this.viewForm.image_file);
      }

      if (this.viewForm.swc_auto14) {
            this.swcUrlv0 = await this.getImageUrl1(this.viewForm.swc_auto14,this.viewForm.image_file,this.viewForm.cell_id);
      }
      if (this.viewForm.swc_v1) {
            this.swcUrlv1 = await this.getImageUrl1(this.viewForm.swc_v1,this.viewForm.image_file,this.viewForm.cell_id);
      }
      if (this.viewForm.swc_v2) {
            this.swcUrlv2 = await this.getImageUrl1(this.viewForm.swc_v2,this.viewForm.image_file,this.viewForm.cell_id);
      }

      if (this.viewForm.image_file && this.viewForm.swc_auto14) {
            this.mip_swc_urlv0=await this.getImageUrl2(this.viewForm.image_file, this.viewForm.swc_auto14,this.viewForm.cell_id);
      }
      if (this.viewForm.image_file && this.viewForm.swc_v1) {
            this.mip_swc_urlv1=await this.getImageUrl2(this.viewForm.image_file, this.viewForm.swc_v1,this.viewForm.cell_id);
      }
      if (this.viewForm.image_file && this.viewForm.swc_v2) {
            this.mip_swc_urlv2=await this.getImageUrl2(this.viewForm.image_file, this.viewForm.swc_v2,this.viewForm.cell_id);
      }

    },
    
    async showFullImage(imagePath) {
      this.fullImageUrl = await this.getImageUrl(imagePath);
      this.fullImageDialogVisible = true;
    },
    async showFullSWC(imagePath) {    //展示不同版本SWC图像
    if(this.selectedVersion === 'v0')
     {
          this.fullImageUrl = await this.getImageUrl1(imagePath.swc_auto14,this.viewForm.image_file,this.viewForm.cell_id);
          this.fullImageDialogVisible = true;
     }
     else if (this.selectedVersion === 'v1')
     {
          this.fullImageUrl = await this.getImageUrl1(imagePath.swc_v1,this.viewForm.image_file,this.viewForm.cell_id);
          this.fullImageDialogVisible = true;
     }
     else if (this.selectedVersion === 'v2')
     {
          this.fullImageUrl = await this.getImageUrl1(imagePath.swc_v2,this.viewForm.image_file,this.viewForm.cell_id);
          this.fullImageDialogVisible = true;
     }
    },
    async showFullBoth(imagePath,swcPath) {
        if(this.selectedVersion === 'v0')
         {
              this.fullImageUrl = await this.getImageUrl2(imagePath,swcPath.swc_auto14,this.viewForm.cell_id);
              this.fullImageDialogVisible = true;
         }
         else if (this.selectedVersion === 'v1')
         {
              this.fullImageUrl = await this.getImageUrl2(imagePath,swcPath.swc_v1,this.viewForm.cell_id);
              this.fullImageDialogVisible = true;
         }
         else if (this.selectedVersion === 'v2')
         {
              this.fullImageUrl = await this.getImageUrl2(imagePath,swcPath.swc_v2,this.viewForm.cell_id);
              this.fullImageDialogVisible = true;
         }

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
        swc_v2:'',
        swc_v1:'',
        swc_auto14:'',
        image_file: '',
        cell_id: '',
        patient_number: '',
        tissue_block_number: '',
        small_number: '',
        slice_number: '',
        confirmed: '',
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
        confirmed_0: '',
        tissue_dissection_time: '',
        perfusion_start_time: '',
        perfusion_end_time: '',
        after_surgery_hours: '',
        cell_depth: '',
        perfusion_current: '',
        perfusion_time_on: '',
        perfusion_time_off: '',
        dye_name:'',
        dye_concentration: '',  
        experiment_temperature: '',
        experiment_humidity: '',
        inject_method: '',
        perfusion_date: '',
        perfusion_staff: '',
        ihc_category: '',
        immunohistochemistry: '',
        first_antibody_concentration: '',
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
        image_size: '',
        confirmed_1: '',
        reconstruction_staff: '',
        status: '',
        inspection_staff: '',
        status_0: '',
        sealed_slide: '',
        status_1: ''
      };
    },

    openRecordBookDialog() {
      this.recordBookDialogVisible = true;
      this.fetchRecordBookPics();
    },
    handleUploadSuccess(response, file, fileList) {
      this.$message.success('Upload successful');
      this.fileList = fileList;
      this.fetchRecordBookPics(); // Refresh the pictures list after upload
    },
    handlePictureCardPreview(file) {
      // 使用动态的 axios 默认路径
      const timestamp = new Date().getTime(); // 获取当前时间戳
      // this.previewImageUrl = `${axios.defaults.baseURL}/Record_Book_Pics/${file.name}`;
      this.previewImageUrl = `${axios.defaults.baseURL}/Record_Book_Pics/${file.name}?v=${timestamp}`;
      this.previewDialogVisible = true;
    },
    beforeUpload(file) {
      const isJPG = file.type === 'image/jpeg';
      const isPNG = file.type === 'image/png';
      const isLt20M = file.size / 1024 / 1024 < 20;

      if (!isJPG && !isPNG) {
        this.$message.error('Upload image should be JPG or PNG format!');
      }
      if (!isLt20M) {
        this.$message.error('Upload image size should not exceed 20MB!');
      }
      return (isJPG || isPNG) && isLt20M;
    },
    async uploadImage(file) {
      const isValid = this.beforeUpload(file);
      if (!isValid) return false;

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await axios.post('/api/upload_pics', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        this.handleUploadSuccess(response, file, this.fileList);
      } catch (error) {
        console.error('Error uploading file:', error);
        this.$message.error('Failed to upload image');
      }
      return false; // prevent default upload behavior
    },
    fetchRecordBookPics() {
      axios.get('/api/record_book_pics')
        .then(response => {
          this.recordBookPics = response.data.pics.map(pic => ({ name: pic }));
        })
        .catch(error => {
          console.error('Error fetching record book pics:', error);
          this.$message.error('Failed to fetch record book pics');
        });
    }
  },
    mounted() {
        this.updateSwcUrl(); // 初始化时更新不同版本 SWC URL
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
  display: flex; 
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
/* 多版本SWC下拉框style设置*/
.custom-select {
    width: 100px; /* 设置初始宽度 */
    padding: 8px; /* 内边距 */
    border: 1px solid #ccc; /* 边框 */
    border-radius: 5px; /* 圆角 */
    background-color: #fff; /* 背景颜色 */
    color: #333; /* 字体颜色 */
    font-size: 16px; /* 字体大小 */
    cursor: pointer; /* 鼠标悬停时显示为手形 */
    transition: border-color 0.3s; /* 添加过渡效果 */
}

.custom-select:hover {
    border-color: #007BFF; /* 悬停时改变边框颜色 */
}

.custom-select:focus {
    outline: none; /* 去掉默认的聚焦轮廓 */
    border-color: #007BFF; /* 聚焦时改变边框颜色 */
}
/* 多版本SWC下拉框style设置结束 */
/* .full-image-preview {
  width: 100%;
} */
</style>
