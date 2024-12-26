<template>
  <div class="container">
    <SearchPreparation @search="receiveData" />

    <div style="display: flex; justify-content: space-between;">
      <div>
        <el-tooltip content="新建注射记录表">
          <el-button type="primary" class="btn" @click="handleNew">New</el-button>
        </el-tooltip>
      </div>

      <!-- 表单外的操作按钮：Cache, Inspect -->
      <el-button type="primary" class="btn" @click="openInjectionFilesDialog">Injection Files</el-button>
    </div>

    <!-- 数据表格区域 -->
    <table class="data-table">
      <thead>
      <tr>
        <th>Sample ID</th>
        <th>Tissue ID</th>
        <th>Roll ID</th>
        <th>Slice ID</th>
        <th>Block ID</th>
        <th>Channels</th>
        <th>Needles</th>
        <th>Status</th>
        <th>Injection info</th>
        <th>Injection files</th>
        <th>Imaging info</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(row) in filteredData" :key="row.id">
        <td>{{ row.sampleId }}</td>
        <td>{{ row.tissueId }}</td>
        <td>{{ row.rollId }}</td>
        <td>{{ row.sliceId }}</td>
        <td>{{ row.blockId }}</td>
        <td>{{ row.channels }}</td>
        <td>{{ row.needles }}</td>
        <td>{{ row.status }}</td>
        <td>
          <el-button type="primary" class="btn" @click="handleViewEdit(row)">View / Edit</el-button>
        </td>
        <td>
          <el-tooltip
            content="replace the injection file"
          >
            <el-button type="primary" class="btn" :disabled="(row.imaging_records.length > 0)" @click="uploadInjection(row)">Upload</el-button>
          </el-tooltip>
          <el-button type="primary" class="btn" @click="downloadInjection(row)">Download</el-button>
          <el-button type="primary" class="btn" @click="uploadBrightField(row)">Bright field data</el-button>
        </td>
        <td>
          <el-button type="primary" class="btn" @click="openImagingDialog(row)">Imaging info</el-button>
        </td>
      </tr>
      </tbody>
    </table>
    <el-dialog v-model="editDialogVisible" title="View / Edit Sample" width="600px">
      <el-form :model="editForm" label-width="120px">
        <!-- Sample ID（只读） -->
        <el-form-item label="Sample ID">
          <el-input v-model="editForm.sampleId" disabled></el-input>
        </el-form-item>
        <!-- Tissue ID（只读） -->
        <el-form-item label="Tissue ID">
          <el-input v-model="editForm.tissueId" disabled></el-input>
        </el-form-item>
        <!-- Roll ID（只读） -->
        <el-form-item label="Roll ID">
          <el-input v-model="editForm.rollId" disabled></el-input>
        </el-form-item>
        <!-- Slice ID（只读） -->
        <el-form-item label="Slice ID">
          <el-input v-model="editForm.sliceId" disabled></el-input>
        </el-form-item>
        <!-- Block ID（只读） -->
        <el-form-item label="Block ID">
          <el-input v-model="editForm.blockId" disabled></el-input>
        </el-form-item>
        <!-- Channels（可编辑） -->
        <el-form-item label="Channels">
          <el-input v-model="editForm.channels" type="number"></el-input>
        </el-form-item>
        <!-- Needles（可编辑） -->
        <el-form-item label="Needles">
          <el-input v-model="editForm.needles" type="number"></el-input>
        </el-form-item>
        <!-- Status（只读） -->
        <el-form-item label="Status">
          <el-input v-model="editForm.status" disabled></el-input>
        </el-form-item>
      </el-form>
      <!-- Footer Buttons -->
      <template #footer>
        <button class="btn" @click="editDialogVisible = false">Cancel</button>
        <button class="btn" @click="saveSampleData">Save</button>
      </template>
    </el-dialog>

    <!-- 编辑/新建 数据的Dialog -->
    <el-dialog v-model="uploadDialogVisible" title="Upload an injection file and create a sample record" width="50%">
      <el-form :model="editForm" label-width="150px">
        <!-- 上传文件 -->
        <el-form-item label="Upload CSV File">
          <el-upload
              class="upload-demo"
              drag
              :multiple="false"
              :file-list="fileList"
              :before-upload="parseFileName"
              :on-change="handleFileChange"
              :on-remove="handleFileRemove"
              :auto-upload="false"
          >
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">Drag .csv file here or click to upload</div>
          </el-upload>
        </el-form-item>

        <!-- Channels -->
        <el-form-item label="Channels Number">
          <el-input v-model.number="editForm.channels" type="number" placeholder="Enter channels number" />
        </el-form-item>

        <!-- Needles -->
        <el-form-item label="Needles Number">
          <el-input v-model.number="editForm.needles" type="number" placeholder="Enter needles number" />
        </el-form-item>
      </el-form>

      <!-- Dialog Footer -->
      <template #footer>
        <el-button type="danger" class="btn" @click="cancelUpload">Cancel</el-button>
        <el-button type="primary" @click="saveUploadedData">Save</el-button>
      </template>
    </el-dialog>
    <!-- Imaging Info Dialog -->
    <!-- 新建 Imaging Info的 dialog -->
    <el-dialog v-model="uploadImageDialogVisible" title="Upload imaging info files and create imaging records" width="50%">
      <el-form :model="editForm" label-width="150px">
        <!-- 上传文件 -->
        <el-form-item label="Upload xlsx/xml File">
          <el-upload
              class="upload-demo"
              drag
              :multiple="false"
              :file-list="imagingFileList"
              :before-upload="parseImagingFileName"
              :on-change="handleImagingFileChange"
              :on-remove="handleImagingFileRemove"
              :auto-upload="false"
          >
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">Drag .xlsx/xml file here or click to upload</div>
          </el-upload>
        </el-form-item>
      </el-form>

      <!-- Dialog Footer -->
      <template #footer>
        <el-button @click="cancelUpload">Cancel</el-button>
        <el-button type="primary" @click="newImagingRecord">Save</el-button>
      </template>
    </el-dialog>

    <el-dialog
        v-model="showImagingDialog"
        width="80%"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        @close="closeImagingDialog"
    >
      <template #title>
        Imaging Records of {{ currentSampleId }}
      </template>
      <div class="dialog-content">
        <div class="new-injection-section">
          <el-tooltip content="create a new Imaging Record">
            <el-button type="primary" class="btn" @click="handleNewImagingRecord">New</el-button>
          </el-tooltip>
          <el-tooltip content="upload and show Imaging map">
            <el-button type="primary" class="btn" @click="uploadImagingMap">Imaging map</el-button>
          </el-tooltip>
        </div>
        <table class="imaging-table">
          <thead>
          <tr>
            <th>
              <input type="checkbox" v-model="imagingSelectAll" @change="toggleSelectAllImaging" />
            </th>
            <th>Imaging ID</th>
            <th>Producer</th>
            <th>Status</th>
            <th>View Options</th>
            <th>Upload Files</th>
            <th>Upload to SQL</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(img) in imagingRecords" :key="img.id">
            <td>
              <input type="checkbox" v-model="selectedImagingIds" :value="img.imaging_id" />
            </td>
            <td>{{ img.imaging_id }}</td>
            <td>{{ img.producer }}</td>
            <td>{{ img.status }}</td>
            <td>
              <button class="btn" @click="viewEditBlock(img)">View / Edit / Download</button>
              <button class="btn" @click="imageMIP(img)">Image MIP</button>
            </td>
            <td>
              <button class="btn" @click="uploadImagingData(img)">Imaging data</button>
              <button class="btn" @click="uploadImagingMetadata(img)">Metadata</button>
              <button class="btn" @click="uploadImagingMarker(img)">Soma</button>
              <button class="btn" @click="uploadImagingMatchTable(img)">Injection matched table</button>
            </td>
            <td>
              <button class="btn" @click="toCell(img)" :disabled="!(img.status === 'imaged' && img.marked)">To cell</button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
      <template #footer>
        <el-button type="danger" class="btn" @click="deleteImagingRecords">Delete</el-button>
        <el-button type="primary" class="btn" @click="saveImagingRecords">Save</el-button>
      </template>
    </el-dialog>

    <!-- Imaging Block Edit Dialog -->
    <el-dialog v-model="editImageDialogVisible" title="Imaging Block Detail" width="600px">
      <el-form :model="imagingBlockForm" label-width="120px">
        <el-form-item label="Imaging ID">
          <el-input v-model="imagingBlockForm.imaging_id" disabled></el-input>
        </el-form-item>
        <el-form-item label="Producer">
          <el-input v-model="imagingBlockForm.producer"></el-input>
        </el-form-item>
        <el-form-item label="Status">
          <el-select v-model="imagingBlockForm.status" placeholder="Select">
            <el-option label="Imaged" value="imaged"></el-option>
            <el-option label="Marked" value="marked"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <button class="btn" @click="editImageDialogVisible = false">Cancel</button>
        <button class="btn" @click="saveImagingBlock">Save</button>
        <button class="btn" @click="downloadImagingBlock">Download</button>
      </template>
    </el-dialog>

    <!-- Imaging Info upload Dialog -->
    <el-dialog title="Upload Imaging Metadata" v-model="imagingMetadataDialogVisible" width="50%">
      <el-form label-width="150px">
        <el-upload
            class="upload-demo"
            drag
            :multiple="true"
            :file-list="metadataFilesList"
            :before-upload="validateMetadataFile"
            :on-change="handleMetadataFilesChange"
            :on-remove="handleMetadataFilesRemove"
            :auto-upload="false"
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">Drag .xlsx or .xml file here or click to upload</div>
        </el-upload>
      </el-form>
        <!-- Upload Button -->
      <template #footer>
        <el-button
            type="primary"
            @click="uploadImagingMetadataFiles"
            :disabled="metadataFilesList.length === 0">
          Upload
        </el-button>
        <el-button @click="imagingMetadataDialogVisible = false">Cancel</el-button>
      </template>
    </el-dialog>
    <el-dialog title="Upload Imaging Marker" v-model="imagingMarkerDialogVisible" width="50%">
      <el-form label-width="150px">
        <el-upload
            class="upload-demo"
            drag
            :multiple="true"
            :file-list="metadataFilesList"
            :before-upload="validateMarkerFile"
            :on-change="handleMarkerFilesChange"
            :on-remove="handleMarkerFilesRemove"
            :auto-upload="false"
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">Drag .marker or .apo file here or click to upload</div>
        </el-upload>
      </el-form>
      <!-- Upload Button -->
      <template #footer>
        <el-button
            type="primary"
            @click="uploadImagingMarkerFiles"
            :disabled="markerFilesList.length === 0">
          Upload
        </el-button>
        <el-button @click="imagingMarkerDialogVisible = false">Cancel</el-button>
      </template>
    </el-dialog>
    <el-dialog title="Upload Imaging Match Table" v-model="imagingMatchTableDialogVisible" width="50%">
      <el-form label-width="150px">
        <el-upload
            class="upload-demo"
            drag
            :multiple="true"
            :file-list="matchTableFilesList"
            :before-upload="validateMatchTable"
            :on-change="handleMatchTableChange"
            :on-remove="handleMatchTableRemove"
            :auto-upload="false"
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">Drag PTRS(B)(N)-matched.csv file here or click to upload</div>
        </el-upload>
      </el-form>
      <!-- Upload Button -->
      <template #footer>
        <el-button
            type="primary"
            @click="uploadImagingMatchTableFiles"
            :disabled="matchTableFilesList.length === 0">
          Upload
        </el-button>
        <el-button @click="imagingMatchTableDialogVisible = false">Cancel</el-button>
      </template>
    </el-dialog>
    <el-dialog title="Injection Files" v-model="injectionFilesDialogVisible" width="50%">
      <!-- 存储/下载/上传(入库) 功能选择 -->
      <el-radio-group v-model="selectedTab" @change="handleTabChange">
        <el-radio-button value="storage">01 Cache</el-radio-button>
        <el-radio-button value="download">02 Inspect</el-radio-button>
      </el-radio-group>

      <!-- 存储部分 -->
      <div v-show="selectedTab === 'storage'">
        <el-form label-width="120px">
          <el-form-item label="Subfolder Name" style="margin-top: 18px; margin-bottom: 15px;">
            <el-input v-model="subfolderName" placeholder="Enter subfolder name, for example, P00001-T001-R001-S001"></el-input>
          </el-form-item>

          <el-upload
              class="upload-demo"
              drag
              :multiple="true"
              :file-list="injectionFilesList"
              :before-upload="beforeUpload"
              :on-change="handleFilesChange"
              :on-remove="handleFilesRemove"
              :auto-upload="false"
          >
            <template #default>
              <i class="el-icon-upload"></i>
              <div class="el-upload__text">Drag files here or click to upload</div>
              <div class="el-upload__tip">Please upload .csv file and two images.</div>
            </template>
          </el-upload>

          <!-- 存储按钮 -->
          <el-button type="primary" @click="uploadAllFiles" :disabled="injectionFilesList.length === 0">Upload Subfolder</el-button>
        </el-form>
      </div>

      <!-- 下载部分 -->
      <div v-show="selectedTab === 'download'">
        <!-- 确保 folderList 加载完成后再渲染 el-select -->
        <el-select v-if="folderList.length > 0" v-model="selectedFolder" placeholder="Select folder" style="margin-top: 18px; margin-bottom: 15px;">
          <el-option
              v-for="folder in folderList"
              :key="folder"
              :label="folder"
              :value="folder">
          </el-option>
        </el-select>
        <el-button type="primary" @click="downloadFolder" :disabled="!selectedFolder">Download Subfolder</el-button>
      </div>
      <template #footer>
        <el-button @click="injectionFilesDialogVisible = false">Cancel</el-button>
      </template>
    </el-dialog>

    <el-dialog
        v-model="showImagingMapDialog"
        width="80%"
    >
      <template #title>
        Imaging Map of {{ currentSampleId }}
      </template>
      <div v-if="imagingMapUrl" style="display: flex;justify-content: center;align-items: center;">
        <!-- 显示已上传图片 -->
        <img :src="imagingMapUrl" alt="Uploaded Image" style="width: 70%;"/>
      </div>

      <div v-else>
        <p>No image found. Please upload an image.</p>
      </div>

      <template #footer>
        <el-button type="primary" class="btn" @click="openUploadImagingMapFile">Upload/Replace</el-button>
      </template>
    </el-dialog>
    <el-dialog title="Upload Imaging Metadata" v-model="uploadImagingMapVisible" width="50%">
      <el-form label-width="150px">
        <el-upload
            class="upload-demo"
            drag
            :file-list="imagingMapFilesList"
            :on-change="handleimagingMapChange"
            :on-remove="handleimagingMapRemove"
            :auto-upload="false"
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">Drag files here or <em>click to upload</em></div>
          <div class="el-upload__tip">File types: PNG, JPEG, JPG</div>
        </el-upload>
      </el-form>
      <template #footer>
        <el-button
            type="primary"
            @click="uploadImagingMapFiles"
            :disabled="imagingMapFilesList.length === 0">
          Upload
        </el-button>
        <el-button @click="uploadImagingMapVisible = false">Cancel</el-button>
      </template>
    </el-dialog>
    <el-dialog
        v-model="showImagingMIP"
        width="80%"
    >
      <template #title>
        Imaging MIP of {{ currentSampleId }}
      </template>
      <div v-if="imagingMIPUrl" style="display: flex;justify-content: center;align-items: center;">
        <!-- 显示已上传图片 -->
        <img :src="imagingMIPUrl" style="width: 70%;"/>
      </div>
      <div v-else>
        <p>No MIP found. Please upload an image.</p>
      </div>
    </el-dialog>
    <el-dialog title="Upload Imaging Data" v-model="uploadImagingDataVisible" width="50%">
      <el-form label-width="150px">
        <el-upload
            class="upload-demo"
            drag
            :file-list="imagingDataFilesList"
            :on-change="handleimagingDataChange"
            :on-remove="handleimagingDataRemove"
            :auto-upload="false"
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">Drag files here or <em>click to upload</em></div>
          <div class="el-upload__tip">File types: h5, v3draw, v3dpbd</div>
        </el-upload>
      </el-form>
      <template #footer>
        <el-button
            type="primary"
            @click="uploadImagingDataFiles"
            :disabled="imagingDataFilesList.length === 0">
          Upload
        </el-button>
        <el-button @click="uploadImagingDataVisible = false">Cancel</el-button>
      </template>
    </el-dialog>
    <el-dialog title="Upload Bright Field Data" v-model="uploadBrightFieldDataVisible" width="50%">
      <el-form label-width="150px">
        <el-upload
            class="upload-demo"
            drag
            :file-list="brightFieldDataFilesList"
            :on-change="handleBrightFieldDataChange"
            :on-remove="handleBrightFieldDataRemove"
            :auto-upload="false"
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">Drag files here or <em>click to upload</em></div>
          <div class="el-upload__tip">File types: tiff</div>
        </el-upload>
      </el-form>
      <template #footer>
        <el-button
            type="primary"
            @click="uploadBrightFieldDataFiles"
            :disabled="brightFieldDataFilesList.length === 0">
          Upload
        </el-button>
        <el-button @click="uploadBrightFieldDataVisible = false">Cancel</el-button>
      </template>
    </el-dialog>
    <el-dialog title="Upload Injection FIle" v-model="uploadInjectionFileVisible" width="50%">
      <el-form label-width="150px">
        <el-upload
            class="upload-demo"
            drag
            :file-list="fileList"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :auto-upload="false"
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">Drag files here or <em>click to upload</em></div>
          <div class="el-upload__tip">File types: csv</div>
        </el-upload>
      </el-form>
      <template #footer>
        <el-button
            type="primary"
            @click="uploadInjectionFile"
            :disabled="fileList.length === 0">
          Upload
        </el-button>
        <el-button @click="uploadInjectionFileVisible = false">Cancel</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox} from 'element-plus';
import axios from 'axios';
import SearchPreparation from './Search_for_Preparation.vue';

// 配置 Axios 实例
const api = axios.create({
  baseURL: 'http://localhost:8000/api', // 根据实际情况修改
  headers: {
    'Content-Type': 'application/json',
  },
});

// 搜索参数
const searchParams = ref({
  sampleId: '',
  colorChannel: '',
  needleNumber: '',
  operator: '',
  sliceStatus: '',
});

// 原始数据
const rawData = ref([]);

// 过滤数据
const filteredData = computed(() => {
  return rawData.value.filter(item => {
    const matchSample = searchParams.value.sampleId
        ? item.sampleId.toLowerCase().includes(searchParams.value.sampleId.toLowerCase())
        : true;
    const matchChannel = searchParams.value.colorChannel
        ? item.channels.toString().includes(searchParams.value.colorChannel)
        : true;
    const matchNeedle = searchParams.value.needleNumber
        ? item.needles.toString().includes(searchParams.value.needleNumber)
        : true;
    const matchOperator = searchParams.value.operator
        ? item.operator && item.operator.toLowerCase().includes(searchParams.value.operator.toLowerCase())
        : true;
    const matchSliceStatus = searchParams.value.sliceStatus
        ? item.status.toLowerCase().includes(searchParams.value.sliceStatus.toLowerCase())
        : true;
    return matchSample && matchChannel && matchNeedle && matchOperator && matchSliceStatus;
  });
});

// 编辑对话框
const uploadDialogVisible = ref(false);
const editDialogVisible = ref(false)

let editForm = ref({
  id: null,
  sampleId: '',
  tissueId: '',
  rollId: '',
  sliceId: '',
  blockId: '--',
  channels: 0,
  needles: 0,
  status: 'injected', // 默认状态为 injected
  operator: '',
});
let fileList = ref([]);

// Imaging dialog
const showImagingDialog = ref(false);
const imagingRecords = ref([]);
const imagingSelectAll = ref(false);
const selectedImagingIds = ref([]);
let currentSampleId = ref(''); // 当前选中的样本 ID
let currentSampleIndex = ref('')

// Imaging Block Edit Dialog
const uploadImageDialogVisible = ref(false)
const editImageDialogVisible = ref(false)
const imagingBlockForm = ref({
  imaging_id: null,
  sample_preparation_id: null,
  status: 'imaged', // 默认状态为 injected
  producer: '',
});
let imagingFileList = ref([]);

const injectionFilesDialogVisible = ref(false);
let selectedTab = ref('storage'); // 默认选择上传功能
let subfolderName = ref(''); // 用户输入的子文件夹名称
let folderList = ref([]);  // 存储已有子文件夹列表，确保其初始值为一个空数组
let selectedFolder = ref(null);  // 选中的文件夹，初始化为 null
let injectionFilesList = ref([]);  // 存储上传的文件列表
const uploadInjectionFileVisible = ref(false);

/*
upload imaging files
*/
const imagingMetadataDialogVisible = ref(false);
let metadataFilesList = ref([]);  // 存储已有子文件夹列表，确保其初始值为一个空数组
const imagingMarkerDialogVisible = ref(false);
let markerFilesList = ref([]);  // 存储已有子文件夹列表，确保其初始值为一个空数组
const imagingMatchTableDialogVisible = ref(false);
let matchTableFilesList = ref([]);  // 存储已有子文件夹列表，确保其初始值为一个空数组
const uploadImagingDataVisible = ref(false);
let imagingDataFilesList = ref([]);  // 存储已有子文件夹列表，确保其初始值为一个空数组
const uploadBrightFieldDataVisible = ref(false);
let brightFieldDataFilesList = ref([]);  // 存储已有子文件夹列表，确保其初始值为一个空数组

const showImagingMapDialog = ref(false);
let imagingMapFilesList = ref([]);
let imagingMapUrl = ref('');
const uploadImagingMapVisible = ref(false);
const showImagingMIP = ref(false);
let imagingMIPUrl = ref('')

// 初始化获取数据
onMounted(() => {
  fetchData();
});

// 从后端获取数据
async function fetchData() {
  try {
    const response = await api.get('/sample_preparation');
    rawData.value = response.data;
    console.log('rawdata',rawData);
  } catch (error) {
    console.error('Error fetching data:', error);
    ElMessage.error('Failed to fetch data.');
  }
}

// 接收搜索参数
function receiveData(params) {
  searchParams.value = params;
}

function beforeUpload(file) {
  // 获取文件的扩展名
  const fileExtension = file.name.split('.').pop().toLowerCase();

  // 判断文件是否为 CSV 或图片
  const isCSVOrImage = fileExtension === 'csv' || file.type.startsWith('image/');

  if (!isCSVOrImage) {
    ElMessage.error('Only CSV and image file are allowed.');
    return false;
  }
  return true;
}

function handleTabChange() {
  console.log('selectedTab: ', selectedTab.value);
}
  // 文件变更处理
function handleFilesChange(file, filesList) {
  injectionFilesList.value = filesList;  // 更新文件列表
}
function handleFilesRemove(file, filesList) {
  injectionFilesList.value = filesList;  // 更新文件列表
}
function validateSubfolderName() {
  const pattern = /^P\d{5}-T\d{3}-R\d{3}-S\d{3}(-B\d)?$/;
  return pattern.test(subfolderName.value);
}
async function uploadAllFiles() {
  console.log('uploadAllFiles');
  if (!subfolderName.value) {
    ElMessage.error('Please enter a subfolder name. Expected format: P00001-T001-R001-S001(-B1)');
    return;
  }
  console.log('uploadAllFiles',subfolderName.value);
  // 检查subfolderName格式
  if (!validateSubfolderName()) {
    console.log('Please check the subfolder name.');
    return;
  }
  console.log('uploadAllFiles',subfolderName.value);
  const formData = new FormData();
  formData.append('subfolder_name', subfolderName.value);  // 用户输入的子文件夹名称
  console.log(formData)
  injectionFilesList.value.forEach(file => {
    formData.append('files', file.raw);  // 将每个文件添加到 formData 中
  });

  await api.post('/upload_files', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
      .then(() => {
        ElMessage.success('Files stored successfully.');
        injectionFilesList = [];  // 清空文件列表
        subfolderName = '';    // 清空 subfolderName
      })
      .catch(() => {
        ElMessage.error('Failed to store files. Please try again.');
      });
}
// 新建数据项
function handleNew() {
  resetForm();
  uploadDialogVisible.value = true;
}
function resetForm() {
  editForm.value = {
    id: null,
    sampleId: '',
    tissueId: '',
    rollId: '',
    sliceId: '',
    blockId: '--', // 默认值
    channels: 0,
    needles: 0,
    status: 'injected',
    operator: '',
  };
  fileList.value = [];
}

// 预览/编辑数据项
function handleViewEdit(row) {
  editForm.value = { ...row };
  editDialogVisible.value = true;
}
function handleFileChange(file) {
  console.log(file);
  fileList.value = [file];
  parseFileName(file);
}
function handleFileRemove() {
  fileList.value = [];
}
// 在上传文件前解析文件名
function parseFileName(file) {
  console.log(file)
  const fileName = file.name.replace('.csv', ''); // 去掉文件扩展名
  const parts = fileName.split('-'); // 按照 '-' 分割文件名

  // 按顺序解析文件名
  editForm.value.sampleId = parts[0] || '';
  editForm.value.tissueId = parts[1] || '';
  editForm.value.rollId = parts[2] || '';
  editForm.value.sliceId = parts[3] || '';
  editForm.value.blockId = parts[4] || '--'; // 如果没有 blockId，填充为 '--'
  console.log(editForm.value)
  return false; // 停止自动上传
}
async function uploadInjectionFile() {
  if (fileList.value.length === 0) {
    ElMessage.error('Please select a CSV file.');
    return;
  }
  const file =fileList.value[0].raw;
  // 检查文件是否已经存在
  const checkFileExistsResponse = await api.get(`/check_sample_file_exists?filename=${file.name}`);
  if (checkFileExistsResponse.data.exists) {
    try {
      // 显示确认对话框
      await ElMessageBox.confirm(
          'File with the same name already exists. Do you want to overwrite it?',
          {
            confirmButtonText: 'Yes',
            cancelButtonText: 'No',
            type: 'warning',
          }
      );
      console.log('User confirmed overwrite. Proceeding with upload...');
      ElMessageBox.close()
      const formData = new FormData();
      formData.append('file', file);

      api.post('/upload_injection_file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
        .then(() => {
          ElMessage.success('CSV uploaded to database successfully');
          fileList.value = [];
          uploadInjectionFileVisible.value = false;
        })
        .catch(error => {
          if (error.response && error.response.data.detail) {
            const errorMessage = error.response.data.detail;
            if (errorMessage.includes('CSV file must contain an ID column.')) {
              ElMessage.error('File must contain an ID column. Please check and re-upload.');
            } else if (errorMessage.includes('File name does not match its ID column')) {
              ElMessage.error('File name and its ID column do not match. Please check and re-upload.');
            } else if (errorMessage.includes('Missing columns:')) {
              ElMessage.error(`Missing columns: ${errorMessage.split('Missing columns: ')[1]}`);
            } else if (errorMessage.includes('Columns with missing values:')) {
              ElMessage.error(`Columns with missing values: ${errorMessage.split('Columns with missing values: ')[1]}`);
            } else if (errorMessage.includes('No matching sample found')) {
              ElMessage.error('No matching sample found. Please check and re-upload.');
            } else if (errorMessage.includes('Abnormal value in dye_name column.')) {
              ElMessage.error('Abnormal value in dye_name column. Please check and re-upload.');
            } else if (errorMessage.includes('Concentration contents error.')) {
              ElMessage.error('Concentration contents error. Please check and re-upload.');
            } else if (errorMessage.includes('Unable to convert date format.')) {
              ElMessage.error('Unable to convert date format. Please check and re-upload.');
              // } else if (errorMessage.includes('Database insertion failed')) {
              //   ElMessage.error('Table format error. Please check and re-upload.');
            } else if (errorMessage.includes('Database insertion failed:')) {
              ElMessage.error(`Database insertion failed. ${errorMessage.split('Database insertion failed:')[1]}`);
            } else if (errorMessage.includes('Error processing CSV file:')) {
              ElMessage.error(`Error processing CSV file. ${errorMessage.split('Error processing CSV file:')[1]}`);
            } else {
              ElMessage.error(errorMessage);
            }
          } else {
            ElMessage.error('CSV upload to database failed.');
          }
        });
      return 'continue'
    } catch (error) {
      // 用户选择“取消”，终止上传
      console.log('User canceled overwrite. Aborting upload.');
      uploadDialogVisible.value = false
      ElMessageBox.close()
      return 'finish'
    }
  }
}

async function saveUploadedData() {
  console.log(editForm.value)
  if (!editForm.value.sampleId || !editForm.value.tissueId || !editForm.value.rollId || !editForm.value.sliceId) {
    ElMessage.error('SampleID, TissueID, RollID, and SliceID are required.');
    return;
  }

  const formData = new FormData();
  formData.append('sampleId', editForm.value.sampleId);
  formData.append('tissueId', editForm.value.tissueId);
  formData.append('rollId', editForm.value.rollId);
  formData.append('sliceId', editForm.value.sliceId);
  formData.append('blockId', editForm.value.blockId);
  formData.append('channels', editForm.value.channels);
  formData.append('needles', editForm.value.needles);
  formData.append('status', editForm.value.status);
  let result = await uploadInjectionFile()
  if(result === 'success'){
    try {

      const newSample = { ...editForm.value, imaging_records: [] }; // 新建时 imaging_records 为空
      const response = await api.post('/sample_preparation', newSample);
      rawData.value.push(response.data);
      ElMessage.success('New sample added.');
    } catch (error) {
      console.error('Error saving data:', error);
      ElMessage.error('Failed to save data.');
    }
  }
  else {
    ElMessage.info("file already exists.");
    return;
  }

}

// 取消上传
function cancelUpload() {
  uploadDialogVisible.value = false;
  resetForm();
}

// 保存样本数据（新建或更新）
async function saveSampleData() {
  if (!editForm.value.sampleId) {
    ElMessage.warning('Sample ID is required.');
    return;
  }
    // PUT 到后端更新
  try {
    const updatedSample = {...editForm.value, imaging_records: editForm.value.imaging_records || []};
    const response = await api.put(`/sample_preparation/${editForm.value.id}`, updatedSample);
    const index = rawData.value.findIndex(item => item.id === editForm.value.id);
    if (index > -1) {
      rawData.value.splice(index, 1, response.data);
      ElMessage.success('Sample updated.');
    }
  } catch (error) {
    console.error('Error updating sample:', error);
    ElMessage.error('Failed to update sample.');
  }

  editDialogVisible.value = false;
}

function openInjectionFilesDialog() {
  injectionFilesDialogVisible.value = true;
  loadFolders();  // 加载已有子文件夹
}
function loadFolders() {
  api.get('/folders').then(response => {
    console.log('folders response',response);
    folderList.value = response.data.folders;
    if (folderList.value.length > 0) {
      selectedFolder.value = folderList.value[0];  // 设置默认选中的文件夹
    }
  });
}
// 下载文件夹
function downloadFolder() {
  if (!selectedFolder.value) {
    ElMessage.error('Please select a folder.');
    return;
  }
  // 请求下载文件夹，设置 responseType 为 'blob'
  api.get(`/download_folder?folder=${selectedFolder.value}`, {
    responseType: 'blob'  // 必须设置 responseType 为 'blob' 来接收二进制数据
  })
      .then(response => {
        // 创建 Blob 对象
        const blob = new Blob([response.data], { type: 'application/zip' });

        // 创建一个 URL，用于下载文件
        const downloadUrl = window.URL.createObjectURL(blob);

        // 创建一个临时链接并点击，触发下载
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', `${selectedFolder.value}.zip`); // 设置下载文件名
        document.body.appendChild(link);
        link.click();

        // 清理操作
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(link);

        ElMessage.success('Folder downloaded successfully');
      })
      .catch(() => {
        ElMessage.error('Failed to download folder');
      });
}
// Perfusion 和 Bright Field 相关操作
function uploadInjection() {
  uploadInjectionFileVisible.value = true;
}

async function downloadInjection(row) {
  let bNumber = '';
  if (row.blockId !== "--") {
    bNumber = `-${row.blockId}`;
  }
  let sample_preparation_id = `${row.sampleId}-${row.tissueId}-${row.rollId}-${row.sliceId}${bNumber}`;
  try {
    // 使用 Axios 请求文件
    const response = await api.get(`/get_injection_file/${sample_preparation_id}`, {
      responseType: "blob", // 确保返回二进制数据
    });

    // 从响应头获取文件名
    const contentDisposition = response.headers["content-disposition"];
    const fileName = contentDisposition
        ? contentDisposition.match(/filename="?(.+)"?/)[1]
        : `${sample_preparation_id}.csv`;

    // 创建 Blob 并触发下载
    const blob = new Blob([response.data], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName); // 设置文件名
    document.body.appendChild(link);
    link.click();

    // 清理资源
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  } catch (error) {
    console.error("Failed to download file:", error);
    this.$message.error("Failed to download file.");
  }
}

function uploadBrightField(row) {
  currentSampleId.value = `${row.sampleId}-${row.tissueId}-${row.rollId}-${row.sliceId}`;
  // 判断 Block ID 是否为 '--'，如果不是，则添加到末尾
  if (row.blockId && row.blockId !== '--') {
    currentSampleId.value += `-${row.blockId}`;
  }
  console.log('current sample id', currentSampleId.value);
  uploadBrightFieldDataVisible.value = true;
}

async function updateImagingRecordStatus(imagingId, newStatus) {
  try {
    const record = imagingRecords.value.find((rec) => rec.imaging_id === imagingId);
    if (!record) {
      ElMessage.error("Imaging record not found.");
      return;
    }

    // 更新记录的状态
    record.status = newStatus;

    // 后端同步状态
    await api.put(`/imaging_records/${record.sample_preparation_id}/${imagingId}`, record);

    // 检查是否需要更新 Sample 的状态
    await checkAndUpdateSampleStatus(record.sample_preparation_id);

    ElMessage.success(`Imaging record ${imagingId} updated to ${newStatus}.`);
  } catch (error) {
    ElMessage.error(`Failed to update imaging record ${imagingId} to ${newStatus}.`);
  }
}

async function checkAndUpdateSampleStatus(sampleId) {
  try {
    const sample = rawData.value.find((s) => s.id === sampleId);
    if (!sample) {
      ElMessage.error("Sample not found.");
      return;
    }

    const allStatuses = sample.imaging_records.map((record) => record.status);

    // 按状态检测顺序：imaged -> marked -> inserted -> matched
    const orderedStatuses = ["imaged", "marked", "inserted", "matched"];
    for (const status of orderedStatuses) {
      if (allStatuses.every((recStatus) => recStatus === status)) {
        // 更新样本状态为当前状态
        sample.status = status;

        // 后端同步状态
        await api.put(`/sample_preparation/${sampleId}`,sample);

        ElMessage.success(`Sample ${sampleId} updated to ${status}.`);
        return;
      }
    }
  } catch (error) {
    ElMessage.error(`Failed to update sample ${sampleId} status.`);
  }
}
// 更新样本状态
// async function updateSampleStatus(sampleId, status) {
//   try {
//     const sample = rawData.value.find(item => item.id === sampleId);
//     if (!sample) {
//       ElMessage.error('Sample not found.');
//       return;
//     }
//     const updatedSample = { ...sample, status };
//     const response = await api.put(`/sample_preparation/${sampleId}`, updatedSample);
//     const index = rawData.value.findIndex(item => item.id === sampleId);
//     if (index > -1) {
//       rawData.value.splice(index, 1, response.data);
//       ElMessage.success(`Sample status updated to ${status}.`);
//     }
//   } catch (error) {
//     console.error('Error updating sample status:', error);
//     ElMessage.error('Failed to update sample status.');
//   }
// }

// 打开 imaging dialog
function openImagingDialog(row) {
  console.log('Open imaging dialog for:', row);
  showImagingDialog.value = true;
  // 拼接 currentSampleId 的基础部分
  currentSampleId.value = `${row.sampleId}-${row.tissueId}-${row.rollId}-${row.sliceId}`;

  // 判断 Block ID 是否为 '--'，如果不是，则添加到末尾
  if (row.blockId && row.blockId !== '--') {
    currentSampleId.value += `-${row.blockId}`;
  }
  fetchImagingMap()
  console.log('Generated currentSampleId:', currentSampleId.value); // 打印调试信息
  currentSampleIndex.value = row.id
  console.log('currentSampleIndex',currentSampleIndex.value)
  imagingRecords.value = row.imaging_records ? [...row.imaging_records] : [];
  console.log('imagingRecords:', imagingRecords);
}

function parseImagingFileName(file) {
  console.log(file);

  const fileName = file.name.replace(/\.(xlsx|xml)$/, ''); // 去掉文件扩展名
  const samplePrefix = currentSampleId.value; // 当前样本 ID（P00095-T001-R001-S029-B1）
  console.log('current sample id',currentSampleId.value)
  if (!fileName.startsWith(samplePrefix)) {
    console.error('File name does not match the current sample ID!');
    return false; // 停止上传
  }

  const remainingPart = fileName.replace(`${samplePrefix}-`, ''); // 去除 current_sample_id 部分
  const parts = remainingPart.split('-'); // 按照 '-' 分割剩余部分

  // 解析 Imaging ID 和 Producer
  const imagingIdCandidate = parts[0]; // 判断第一个字段是否为 Imaging ID
  let imagingId;
  if (!isNaN(imagingIdCandidate)) {
    console.log(typeof (imagingIdCandidate))
    imagingId = imagingIdCandidate // 如果是数字，则直接赋值为 Imaging ID/
    // imagingId = parseInt(imagingIdCandidate, 10); // 如果是数字，则直接赋值为 Imaging ID/
  } else {
    // imagingId = imagingRecords.value.length + 1; // 否则根据 imagingRecords 长度加 1
    imagingId = '--'
  }

  const producer = parts[parts.length - 1]; // 分割后的最后一个值赋值给 Producer

  // 更新 imagingBlockForm
  imagingBlockForm.value = {
    ...imagingBlockForm.value, // 保留其他字段
    imaging_id: imagingId, // Imaging ID
    producer: producer || '', // Producer，默认为空字符串
  };

  console.log('Updated imagingBlockForm:', imagingBlockForm.value);
  return false; // 停止自动上传
}
function handleImagingFileChange(file) {
  imagingFileList.value = [file];
  parseImagingFileName(file);
}
function handleImagingFileRemove() {
  imagingFileList.value = [];
}
// 关闭 imaging dialog
function closeImagingDialog() {
  showImagingDialog.value = false;
  selectedImagingIds.value = [];
  imagingSelectAll.value = false;
  currentSampleId.value = '';
}

function handleNewImagingRecord() {
  resetImagingBlockForm();
  uploadImageDialogVisible.value = true;
}

function resetImagingBlockForm() {
  imagingBlockForm.value = {
    imaging_id: null,
    sample_preparation_id: null,
    status: 'imaged', // 默认状态为 injected
    producer: '',
  };
  imagingFileList.value = [];
}

async function uploadImagingInfoFiles() {
  const formData = new FormData();
  formData.append('metadata_file', imagingFileList.value[0].raw);
  console.log('formdata',formData)
  api.post('/upload_imaging_metadata', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
      .then(response => {
        // Handle success
        ElMessage.success('File uploaded successfully');
        const uploadedFiles = response.data.uploaded_files || [];
        // Remove uploaded files from the file list
        imagingFileList.value = imagingFileList.value.filter(file => !uploadedFiles.includes(file.name));
      })
      .catch(error => {
        // let error = 'Files upload failed';
        if (error.response && error.response.data.detail) {
          if (typeof error.response.data.detail === 'string') {
            // errorMessage = error.response.data.detail;
          } else if (typeof error.response.data.detail === 'object') {
            // errorMessage = error.response.data.detail.error || 'Files upload failed';
          }
        }
        // ElMessage.error(errorMessage);
      });
}

async function uploadImagingMetadataFiles() {
  const formData = new FormData();
  formData.append('metadata_file', metadataFilesList.value[0].raw);
  console.log('formdata',formData)
  api.post('/upload_imaging_metadata', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
      .then(response => {
        // Handle success
        ElMessage.success('File uploaded successfully');
        const uploadedFiles = response.data.uploaded_files || [];
        // Remove uploaded files from the file list
        metadataFilesList.value = metadataFilesList.value.filter(file => !uploadedFiles.includes(file.name));
      })
      .catch(error => {
        // let error = 'Files upload failed';
        if (error.response && error.response.data.detail) {
          if (typeof error.response.data.detail === 'string') {
            // errorMessage = error.response.data.detail;
          } else if (typeof error.response.data.detail === 'object') {
            // errorMessage = error.response.data.detail.error || 'Files upload failed';
          }
        }
        // ElMessage.error(errorMessage);
      });
}

async function uploadImagingMarkerFiles() {
  const formData = new FormData();
  formData.append('marker_file', markerFilesList.value[0].raw);
  console.log('formData',formData)
  api.post('/upload_imaging_marker', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
      .then(response => {
        // Handle success
        ElMessage.success('File uploaded successfully');
        const uploadedFiles = response.data.uploaded_files || [];
        // Remove uploaded files from the file list
        markerFilesList.value = markerFilesList.value.filter(file => !uploadedFiles.includes(file.name));
        updateImagingRecordStatus(imagingBlockForm.value.imaging_id, "marked");
      })
      .catch(error => {
        let errorMessage = 'Files upload failed';
        if (error.response && error.response.data.detail) {
          if (typeof error.response.data.detail === 'string') {
            errorMessage = error.response.data.detail;
          } else if (typeof error.response.data.detail === 'object') {
            errorMessage = error.response.data.detail.error || 'Files upload failed';
          }
        }
        ElMessage.error(errorMessage);
      });
}

async function uploadImagingMatchTableFiles() {
  const formData = new FormData();
  formData.append('matchtable_file', matchTableFilesList.value[0].raw);
  console.log('formdata',formData)
  api.post('/upload_imaging_match_table', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
      .then(response => {
        // Handle success
        ElMessage.success('File uploaded successfully');
        const uploadedFiles = response.data.uploaded_files || [];
        // Remove uploaded files from the file list
        matchTableFilesList.value = matchTableFilesList.value.filter(file => !uploadedFiles.includes(file.name));
        updateImagingRecordStatus(imagingBlockForm.value.imaging_id, "matched");
      })
      .catch(error => {
        // let error = 'Files upload failed';
        if (error.response && error.response.data.detail) {
          if (typeof error.response.data.detail === 'string') {
            // errorMessage = error.response.data.detail;
          } else if (typeof error.response.data.detail === 'object') {
            // errorMessage = error.response.data.detail.error || 'Files upload failed';
          }
        }
        // ElMessage.error(errorMessage);
      });
}
// 新建 Imaging Record
async function newImagingRecord() {
  try {
    await uploadImagingInfoFiles();

    const newRecord = {
      imaging_id: imagingBlockForm.value.imaging_id, // Imaging ID
      sample_preparation_id: currentSampleIndex.value, // 父表 SamplePreparation 的 ID
      producer: imagingBlockForm.value.producer,
      status: imagingBlockForm.value.status,
    };

    // 发送 POST 请求创建新记录
    const response = await api.post('/imaging_records', newRecord);
    const createdRecord = response.data;

    // 本地更新 imagingRecords
    imagingRecords.value.push(createdRecord);

    // 同时更新 rawData 中对应样本的 imaging_records
    const sampleIndex = rawData.value.findIndex(sample => sample.id === currentSampleIndex.value);
    if (sampleIndex !== -1) {
      rawData.value[sampleIndex].imaging_records.push(createdRecord);
    }

    ElMessage.success('New imaging record added.');
    uploadImageDialogVisible.value = false;
  } catch (error) {
    console.error('Error creating imaging record:', error);
    ElMessage.error('Failed to create imaging record.');
  }
}

async function deleteImagingRecords() {
  if (selectedImagingIds.value.length === 0) {
    ElMessage.warning('No imaging records selected.');
    return;
  }

  try {
    // 遍历 selectedImagingIds 数组，找到所有对应的记录
    const recordsToDelete = selectedImagingIds.value.map(selectedId => {
      const record = imagingRecords.value.find(record => record.imaging_id === selectedId);
      if (record) {
        console.log('Record to delete:', record);
        return {
          imaging_id: record.imaging_id,
          sample_preparation_id: record.sample_preparation_id,
        };
      } else {
        console.warn(`Record with imaging_id ${selectedId} not found.`);
        return null;
      }
    }).filter(record => record !== null); // 过滤掉未找到的记录

    if (recordsToDelete.length === 0) {
      ElMessage.warning('No valid imaging records found to delete.');
      return;
    }

    console.log('Records to delete:', recordsToDelete);

    // 执行批量删除请求
    for (const record of recordsToDelete) {
      await api.delete(`/imaging_records/${record.sample_preparation_id}/${record.imaging_id}`);
    }

    // 本地更新 imagingRecords
    imagingRecords.value = imagingRecords.value.filter(
        record => !selectedImagingIds.value.includes(record.imaging_id)
    );

    // 同时更新 rawData 中的 imaging_records
    const sampleIndex = rawData.value.findIndex(sample => sample.id === currentSampleIndex.value);
    if (sampleIndex !== -1) {
      rawData.value[sampleIndex].imaging_records = imagingRecords.value;
    }

    // 清空选中状态
    selectedImagingIds.value = [];
    imagingSelectAll.value = false;

    ElMessage.success('Selected imaging records deleted.');
  } catch (error) {
    console.error('Error deleting imaging records:', error);
    ElMessage.error('Failed to delete imaging records.');
  }
}

// 保存 imaging records 到后端
async function saveImagingRecords() {
  if (!currentSampleId.value) {
    ElMessage.error('No sample selected.');
    return;
  }
  try {
    const sampleToUpdate = rawData.value.find(item => item.id === currentSampleId.value);
    if (!sampleToUpdate) {
      ElMessage.error('Sample not found.');
      return;
    }
    const updatedSample = { ...sampleToUpdate, imaging_records: imagingRecords.value };
    const response = await api.put(`/sample_preparation/${currentSampleId.value}`, updatedSample);
    const index = rawData.value.findIndex(item => item.id === currentSampleId.value);
    if (index > -1) {
      rawData.value.splice(index, 1, response.data);
    }
    ElMessage.success('Imaging records updated.');
    showImagingDialog.value = false;
  } catch (error) {
    console.error('Error saving imaging records:', error);
    ElMessage.error('Failed to save imaging records.');
  }
}

// 全选/反选 Imaging Records
function toggleSelectAllImaging() {
  if (imagingSelectAll.value) {
    selectedImagingIds.value = imagingRecords.value.map(r => r.id);
  } else {
    selectedImagingIds.value = [];
  }
}

// 打开 Imaging Block Edit Dialog
function viewEditBlock(img) {
  imagingBlockForm.value = { ...img };
  editImageDialogVisible.value = true;
}

// 保存 Imaging Block
async function saveImagingBlock() {
  try {
    const updatedRecord = {
      imaging_id: imagingBlockForm.value.imaging_id,
      sample_preparation_id: imagingBlockForm.value.sample_preparation_id,
      producer: imagingBlockForm.value.producer,
      status: imagingBlockForm.value.status,
    };
    console.log(imagingBlockForm.value);
    // 发送 PUT 请求更新记录
    const response = await api.put(`/imaging_records/${imagingBlockForm.value.sample_preparation_id}/${imagingBlockForm.value.imaging_id}`, updatedRecord);

    // 更新本地表格数据
    const index = imagingRecords.value.findIndex(record => record.imaging_id === imagingBlockForm.value.imaging_id);
    if (index > -1) {
      imagingRecords.value.splice(index, 1, response.data);
      ElMessage.success('Imaging record updated.');
    }
    editImageDialogVisible.value = false;
  } catch (error) {
    console.error('Error saving imaging block:', error);
    ElMessage.error('Failed to update imaging record.');
  }
}

// 下载 Imaging Block
function downloadImagingBlock() {
  console.log('Download imaging block data for:', imagingBlockForm.value);
}

// MIP, imaging data, metadata, somas, injection matched table 等功能
function imageMIP(img) {
  showImagingMIP.value = true;
  fetchImagingMIP(img.imaging_id);
  console.log('Image MIP:', img.imaging_id);
}

function uploadImagingData(img) {
  imagingBlockForm.value = { ...img };
  uploadImagingDataVisible.value = true;
}

function uploadImagingMetadata(img) {
  imagingBlockForm.value = { ...img };
  imagingMetadataDialogVisible.value = true;
}

function uploadImagingMarker(img) {
  imagingBlockForm.value = { ...img };
  imagingMarkerDialogVisible.value = true;
}

function uploadImagingMatchTable(img) {
  imagingBlockForm.value = { ...img };
  imagingMatchTableDialogVisible.value = true;
}

function validateMetadataFile(file) {
  const fileExtension = file.name.split('.').pop().toLowerCase();
  const fileNamePattern = /^P\d{5}-T\d{3}-R\d{3}-S\d{3}(-B\d)?(-\d+)?-[A-Z]{2,3}\.(xlsx|xml)$/;

  if (!fileNamePattern.test(file.name)) {
    this.$message.error('Invalid filename format for metadata file. Expected format: P00001-T001-R001-S001(-B1)(-1)-NAME.xlsx or .xml');
    return false;
  }

  if (!['xlsx', 'xml'].includes(fileExtension)) {
    this.$message.error('Only .xlsx or .xml files are allowed for metadata upload.');
    return false;
  }
  return true;
}

function validateMarkerFile(file) {
  const fileExtension = file.name.split('.').pop().toLowerCase();
  const fileNamePattern = /^P\d{5}-T\d{3}-R\d{3}-S\d{3}(-B\d)?(-\d+)?\.marker$/;

  if (!fileNamePattern.test(file.name)) {
    this.$message.error('Invalid filename format for marker file. Expected format: P00001-T001-R001-S001(-B1)(-1).marker');
    return false;
  }

  if (fileExtension !== 'marker') {
    this.$message.error('Only .marker files are allowed for marker upload.');
    return false;
  }
  return true;
}

function validateMatchTable(file) {
  const fileExtension = file.name.split('.').pop().toLowerCase();
  const fileNamePattern = /^P\d{5}-T\d{3}-R\d{3}-S\d{3}(-B\d)?(-\d+)?(-[A-Za-z_]{2,10})?-matched\.csv$/;

  if (!fileNamePattern.test(file.name)) {
    this.$message.error('Invalid filename format for annotation file. Expected format: P00001-T001-R001-S001(-B1)(-1).apo');
    return false;
  }

  if (fileExtension !== 'apo') {
    this.$message.error('Only .apo files are allowed for annotation upload.');
    return false;
  }
  return true;
}

function handleMetadataFilesChange(file) {
  metadataFilesList.value = [file];
}

function handleMetadataFilesRemove() {
  metadataFilesList.value = [];
}

function handleMarkerFilesChange(file) {
  markerFilesList.value = [file];
}

function handleMarkerFilesRemove() {
  markerFilesList.value = [];
}
function handleMatchTableChange(file) {
  matchTableFilesList.value = [file];
}

function handleMatchTableRemove() {
  matchTableFilesList.value = [];
}

function uploadImagingMap() {
  showImagingMapDialog.value = true;
}
function handleimagingMapChange(file) {
  imagingMapFilesList.value = [file];
}
function handleimagingMapRemove() {
  imagingMapFilesList.value = [];
}
function openUploadImagingMapFile() {
  uploadImagingMapVisible.value = true;
}
function handleimagingDataChange(file) {
  imagingDataFilesList.value = [file];
}
function handleimagingDataRemove() {
  imagingDataFilesList.value = [];
}
function handleBrightFieldDataChange(file) {
  brightFieldDataFilesList.value = [file];
}
function handleBrightFieldDataRemove() {
  brightFieldDataFilesList.value = [];
}

function uploadImagingMapFiles() {
  const formData = new FormData();
  formData.append('imaging_map_file', imagingMapFilesList.value[0].raw);
  api.post('/upload_imaging_map', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
      .then(response => {
        // Handle success
        ElMessage.success('File uploaded successfully');
        const uploadedFiles = response.data.uploaded_files || [];
        // Remove uploaded files from the file list
        imagingMapFilesList.value = imagingMapFilesList.value.filter(file => !uploadedFiles.includes(file.name));
        // updateImagingRecordStatus(imagingBlockForm.value.imaging_id, "matched");
        fetchImagingMap()
      })
      .catch(error => {
        // let error = 'Files upload failed';
        if (error.response && error.response.data.detail) {
          if (typeof error.response.data.detail === 'string') {
            // errorMessage = error.response.data.detail;
          } else if (typeof error.response.data.detail === 'object') {
            // errorMessage = error.response.data.detail.error || 'Files upload failed';
          }
        }
        // ElMessage.error(errorMessage);
      });

}
async function fetchImagingMap() {
  try {
    const response = await api.get(`/get_imaging_map/${currentSampleId.value}`, {
      responseType: "blob", // 确保返回的是 Blob 数据
    });

    // 检查响应是否是 Blob 类型
    if (response.data && response.data instanceof Blob) {
      imagingMapUrl.value = URL.createObjectURL(response.data); // 创建 Blob URL
    } else {
      console.error("Invalid response data");
    }
  } catch (error) {
    console.error("Failed to fetch image:", error);
  }
}

async function fetchImagingMIP(imaging_id) {
  try {
    const response = await api.get(`/get_imaging_mip/${currentSampleId.value}/${imaging_id}`, {
      responseType: "blob", // 确保返回的是 Blob 数据
    });

    // 检查响应是否是 Blob 类型
    if (response.data && response.data instanceof Blob) {
      imagingMIPUrl.value = URL.createObjectURL(response.data); // 创建 Blob URL
    } else {
      imagingMIPUrl.value = '';
      console.error("Invalid response data");
    }
  } catch (error) {
    console.error("Failed to fetch image:", error);
  }
}

async function uploadImagingDataFiles() {
  const formData = new FormData();
  formData.append('imaging_data_file', imagingDataFilesList.value[0].raw);
  await api.post(`/upload_imaging_data/${currentSampleId.value}/${imagingBlockForm.value.imaging_id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
      .then(response => {
        // Handle success
        ElMessage.success('File uploaded successfully');
        const uploadedFiles = response.data.uploaded_files || [];
        // Remove uploaded files from the file list
        imagingMapFilesList.value = imagingMapFilesList.value.filter(file => !uploadedFiles.includes(file.name));
      })
      .catch(error => {
        // let error = 'Files upload failed';
        if (error.response && error.response.data.detail) {
          if (typeof error.response.data.detail === 'string') {
            // errorMessage = error.response.data.detail;
          } else if (typeof error.response.data.detail === 'object') {
            // errorMessage = error.response.data.detail.error || 'Files upload failed';
          }
        }
        // ElMessage.error(errorMessage);
      });

}

async function uploadBrightFieldDataFiles() {
  const formData = new FormData();
  formData.append('bright_field_data_file', brightFieldDataFilesList.value[0].raw);
  await api.post(`/upload_bright_field_fata/${currentSampleId.value}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
      .then(response => {
        // Handle success
        ElMessage.success('File uploaded successfully');
        const uploadedFiles = response.data.uploaded_files || [];
        // Remove uploaded files from the file list
        brightFieldDataFilesList.value = brightFieldDataFilesList.value.filter(file => !uploadedFiles.includes(file.name));
      })
      .catch(error => {
        // let error = 'Files upload failed';
        if (error.response && error.response.data.detail) {
          if (typeof error.response.data.detail === 'string') {
            // errorMessage = error.response.data.detail;
          } else if (typeof error.response.data.detail === 'object') {
            // errorMessage = error.response.data.detail.error || 'Files upload failed';
          }
        }
        // ElMessage.error(errorMessage);
      });

}

function toCell(img) {
  if (img.status === 'imaged' && img.marked) {
    console.log('To cell action:', img);
    // 执行相关操作
  } else {
    ElMessage.warning('Imaged and Marked must both be true to perform this action.');
  }
}
</script>

<style scoped>
.container {
  padding: 16px;
  font-family: sans-serif;
}

.search-bar {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
}

.search-fields {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.search-field {
  display: flex;
  flex-direction: column;
}

.btn {
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  margin: 4px;
}


.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
}

.data-table th,
.data-table td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: left;
}

.external-actions {
  margin-top: 10px;
}

.cache-btn {
  background: #9f9;
}

.inspect-btn {
  background: #9ff;
}

.upload-btn {
  background: #9f9;
}


.new-injection-section {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

/* dialog styling由 el-dialog 提供基本样式，这里扩展内部表格、按钮布局 */
.dialog-content {
  padding: 0;
}


.imaging-map-section {
  margin: 16px 0;
}

.imaging-table {
  width: 100%;
  border-collapse: collapse;
}

.imaging-table th,
.imaging-table td {
  border: 1px solid #999;
  padding: 8px;
  text-align: left;
}
</style>