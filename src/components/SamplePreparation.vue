<template>
  <div class="container">
    <SearchPreparation @search="receiveData" />

    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div class="new-injection-section">
        <el-tooltip content="新建注射记录表">
          <button class="btn new-btn" @click="handleNew">New</button>
        </el-tooltip>
      </div>

      <!-- 表单外的操作按钮：Cache, Inspect -->
      <div class="external-actions">
        <button class="btn cache-btn" @click="handleGlobalCache">Cache</button>
        <button class="btn inspect-btn" @click="handleGlobalInspect">Inspect</button>
      </div>
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
        <th>Perfusion / Brightfield</th>
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
          <button class="btn small-btn" @click="handleViewEdit(row)">View / Edit</button>
        </td>
        <td>
          <button class="btn" @click="uploadPerfusion(row)">Upload</button>
          <button class="btn" @click="downloadPerfusion(row)">Download</button>
          <button class="btn" @click="showBrightField(row)">Bright field data</button>
        </td>
        <td>
          <button class="btn imaging-info-btn" @click="openImagingDialog(row)">Imaging info</button>
        </td>
      </tr>
      </tbody>
    </table>

    <!-- 编辑/新建 数据的Dialog -->
    <el-dialog v-model="editDialogVisible" title="View / Edit Sample" width="600px">
      <el-form :model="editForm" label-width="120px">
        <el-form-item label="Sample ID">
          <el-input v-model="editForm.sampleId"></el-input>
        </el-form-item>
        <el-form-item label="Tissue ID">
          <el-input v-model="editForm.tissueId"></el-input>
        </el-form-item>
        <el-form-item label="Roll ID">
          <el-input v-model="editForm.rollId"></el-input>
        </el-form-item>
        <el-form-item label="Slice ID">
          <el-input v-model="editForm.sliceId"></el-input>
        </el-form-item>
        <el-form-item label="Block ID">
          <el-input v-model="editForm.blockId"></el-input>
        </el-form-item>
        <el-form-item label="Channels">
          <el-input v-model="editForm.channels" type="number"></el-input>
        </el-form-item>
        <el-form-item label="Needles">
          <el-input v-model="editForm.needles" type="number"></el-input>
        </el-form-item>
        <el-form-item label="Status">
          <el-select v-model="editForm.status" placeholder="Select">
            <el-option label="Initial" value="initial"></el-option>
            <el-option label="Injected" value="injected"></el-option>
            <el-option label="Imaged" value="imaged"></el-option>
            <el-option label="Uploaded" value="uploaded"></el-option>
            <el-option label="Marked" value="marked"></el-option>
            <el-option label="Matched" value="matched"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <button class="btn" @click="editDialogVisible = false">Cancel</button>
        <button class="btn" @click="saveSampleData">Save</button>
      </template>
    </el-dialog>

    <!-- Imaging Info Dialog -->
    <el-dialog
        v-model="showImagingDialog"
        title="Imaging Records"
        width="80%"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        @close="closeImagingDialog"
    >
      <div class="dialog-content">
        <div class="new-injection-section">
          <el-tooltip content="新建 Imaging Record">
            <button class="btn new-btn" @click="newImagingRecord">New</button>
          </el-tooltip>
        </div>
        <div class="imaging-map-section">
          <h4>Imaging map (灌注地图, 成像地图)</h4>
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
              <input type="checkbox" v-model="selectedImagingIds" :value="img.id" />
            </td>
            <td>{{ img.id }}</td>
            <td>{{ img.producer }}</td>
            <td>{{ img.status }}</td>
            <td>
              <button class="btn" @click="viewEditBlock(img)">View / Edit / Download</button>
              <button class="btn" @click="imageMIP(img)">Image MIP</button>
            </td>
            <td>
              <button class="btn" @click="showImagingData(img)">Imaging data</button>
              <button class="btn" @click="showMetadata(img)">Metadata</button>
              <button class="btn" @click="showSomas(img)">Somas (APO)</button>
              <button class="btn" @click="showInjectionMatchedTable(img)">Injection matched table</button>
            </td>
            <td>
              <button class="btn" @click="toCell(img)" :disabled="!(img.status === 'imaged' && img.marked)">To cell</button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
      <template #footer>
        <button class="btn delete-btn" @click="deleteImagingRecords">Delete</button>
        <button class="btn" @click="saveImagingRecords">Save</button>
      </template>
    </el-dialog>

    <!-- Imaging Block Edit Dialog -->
    <el-dialog v-model="imagingBlockDialogVisible" title="Imaging Block Detail" width="600px">
      <el-form :model="imagingBlockForm" label-width="120px">
        <el-form-item label="Imaging ID">
          <el-input v-model="imagingBlockForm.id" disabled></el-input>
        </el-form-item>
        <el-form-item label="Producer">
          <el-input v-model="imagingBlockForm.producer"></el-input>
        </el-form-item>
        <el-form-item label="Status">
          <el-select v-model="imagingBlockForm.status" placeholder="Select">
            <el-option label="Initial" value="initial"></el-option>
            <el-option label="Injected" value="injected"></el-option>
            <el-option label="Imaged" value="imaged"></el-option>
            <el-option label="Uploaded" value="uploaded"></el-option>
            <el-option label="Marked" value="marked"></el-option>
            <el-option label="Matched" value="matched"></el-option>
          </el-select>
        </el-form-item>
        <!-- 如果有 imaged 和 marked 字段，可以取消注释并添加到后端 -->
        <!--
        <el-form-item label="Imaged">
          <el-switch v-model="imagingBlockForm.imaged"></el-switch>
        </el-form-item>
        <el-form-item label="Marked">
          <el-switch v-model="imagingBlockForm.marked"></el-switch>
        </el-form-item>
        -->
      </el-form>
      <template #footer>
        <button class="btn" @click="imagingBlockDialogVisible = false">Cancel</button>
        <button class="btn" @click="saveImagingBlock">Save</button>
        <button class="btn" @click="downloadImagingBlock">Download</button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';
import SearchPreparation from './Search_for_Preparation.vue';

// 配置 Axios 实例
const api = axios.create({
  baseURL: 'http://10.194.35.182:8000/api', // 根据实际情况修改
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
const editDialogVisible = ref(false);
const editForm = ref({
  id: null, // 添加 id 字段
  sampleId: '',
  tissueId: '',
  rollId: '',
  sliceId: '',
  blockId: '',
  channels: 0,
  needles: 0,
  status: 'initial', // 默认值为 'initial'
  operator: '',
});
let isNew = false;

// Imaging dialog
const showImagingDialog = ref(false);
const imagingRecords = ref([]);
const imagingSelectAll = ref(false);
const selectedImagingIds = ref([]);
const currentSampleId = ref(null); // 当前选中的样本 ID

// Imaging Block Edit Dialog
const imagingBlockDialogVisible = ref(false);
const imagingBlockForm = ref({});

// 初始化获取数据
onMounted(() => {
  fetchData();
});

// 从后端获取数据
async function fetchData() {
  try {
    const response = await api.get('/sample_preparation');
    rawData.value = response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    ElMessage.error('Failed to fetch data.');
  }
}

// 接收搜索参数
function receiveData(params) {
  searchParams.value = params;
}

// 新建数据项
function handleNew() {
  isNew = true;
  editForm.value = {
    id: null,
    sampleId: '',
    tissueId: '',
    rollId: '',
    sliceId: '',
    blockId: '',
    channels: 0,
    needles: 0,
    status: 'initial',
    operator: '',
  };
  editDialogVisible.value = true;
}

// 预览/编辑数据项
function handleViewEdit(row) {
  isNew = false;
  editForm.value = { ...row };
  editDialogVisible.value = true;
}

// 保存样本数据（新建或更新）
async function saveSampleData() {
  if (!editForm.value.sampleId) {
    ElMessage.warning('Sample ID is required.');
    return;
  }

  if (isNew) {
    // POST 到后端新建
    try {
      const newSample = { ...editForm.value, imaging_records: [] }; // 新建时 imaging_records 为空
      const response = await api.post('/sample_preparation', newSample);
      rawData.value.push(response.data);
      ElMessage.success('New sample added.');
    } catch (error) {
      console.error('Error adding sample:', error);
      ElMessage.error('Failed to add sample.');
    }
  } else {
    // PUT 到后端更新
    try {
      const updatedSample = { ...editForm.value, imaging_records:  editForm.value.imaging_records || [] };
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
  }
  editDialogVisible.value = false;
}

// 全局 Cache & Inspect 操作
function handleGlobalCache() {
  ElMessage.info('Global cache action.');
}

function handleGlobalInspect() {
  ElMessage.info('Global inspect action.');
}

// Perfusion 和 Bright Field 相关操作
function uploadPerfusion(row) {
  console.log('Upload perfusion table for:', row);
  // 上传成功后更新状态为 imaged (示例)
  updateSampleStatus(row.id, 'imaged');
}

function downloadPerfusion(row) {
  console.log('Download perfusion table for:', row);
}

function showBrightField(row) {
  console.log('Show bright field data for:', row);
}

// 更新样本状态
async function updateSampleStatus(sampleId, status) {
  try {
    const sample = rawData.value.find(item => item.id === sampleId);
    if (!sample) {
      ElMessage.error('Sample not found.');
      return;
    }
    const updatedSample = { ...sample, status };
    const response = await api.put(`/sample_preparation/${sampleId}`, updatedSample);
    const index = rawData.value.findIndex(item => item.id === sampleId);
    if (index > -1) {
      rawData.value.splice(index, 1, response.data);
      ElMessage.success(`Sample status updated to ${status}.`);
    }
  } catch (error) {
    console.error('Error updating sample status:', error);
    ElMessage.error('Failed to update sample status.');
  }
}

// 打开 imaging dialog
function openImagingDialog(row) {
  console.log('Open imaging dialog for:', row);
  showImagingDialog.value = true;
  currentSampleId.value = row.id;
  imagingRecords.value = row.imaging_records ? [...row.imaging_records] : [];
}

// 关闭 imaging dialog
function closeImagingDialog() {
  showImagingDialog.value = false;
  selectedImagingIds.value = [];
  imagingSelectAll.value = false;
  currentSampleId.value = null;
}

// 新建 Imaging Record
async function newImagingRecord() {
  try {
    const newRecord = {
      id: 1, // 绑定父表 SamplePreparation 的 ID
      producer: 'wlj',
      status: 'initial',
    };
    console.log(newRecord.sample_preparation_id)
    // 发送 POST 请求创建新记录
    const response = await api.post('/imaging_records', newRecord);
    console.log(response)
    imagingRecords.value.push(response.data); // 将新记录添加到前端表格
    ElMessage.success('New imaging record added.');
  } catch (error) {
    console.error('Error creating imaging record:', error);
    ElMessage.error('Failed to create imaging record.');
  }
}

// 删除选中的 Imaging Records
async function deleteImagingRecords() {
  if (selectedImagingIds.value.length === 0) {
    ElMessage.warning('No imaging records selected.');
    return;
  }
  try {
    // 发送 DELETE 请求，删除选中的记录
    await api.delete('/imaging_records', { data: selectedImagingIds.value });
    // 本地移除已删除的记录
    imagingRecords.value = imagingRecords.value.filter(record => !selectedImagingIds.value.includes(record.id));
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
  imagingBlockDialogVisible.value = true;
}

// 保存 Imaging Block
async function saveImagingBlock() {
  try {
    const updatedRecord = {
      producer: imagingBlockForm.value.producer,
      status: imagingBlockForm.value.status,
    };

    // 发送 PUT 请求更新记录
    const response = await api.put(`/imaging_records/${imagingBlockForm.value.id}`, updatedRecord);

    // 更新本地表格数据
    const index = imagingRecords.value.findIndex(record => record.id === imagingBlockForm.value.id);
    if (index > -1) {
      imagingRecords.value.splice(index, 1, response.data);
      ElMessage.success('Imaging record updated.');
    }

    imagingBlockDialogVisible.value = false;
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
  console.log('Image MIP:', img);
}

function showImagingData(img) {
  console.log('Show imaging data:', img);
}

function showMetadata(img) {
  console.log('Show metadata:', img);
}

function showSomas(img) {
  console.log('Show Somas (APO):', img);
}

function showInjectionMatchedTable(img) {
  console.log('Show injection matched table:', img);
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
  background: #ddd;
}

.new-btn {
  background: #f99;
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

.imaging-info-btn {
  background: #9ef;
}

.new-injection-section {
  margin-top: 16px;
  display: flex;
  align-items: center;
}

/* dialog styling由 el-dialog 提供基本样式，这里扩展内部表格、按钮布局 */
.dialog-content {
  padding: 16px;
}

.delete-btn {
  background: #f66;
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

<!--<template>-->
<!--  <div class="container">-->
<!--    <SearchPreparation @search="receiveData" />-->

<!--    <div style="display: flex;justify-content: space-between;align-items: center;">-->
<!--      <div class="new-injection-section">-->
<!--        <el-tooltip-->
<!--          content="new a injection record table"-->
<!--        >-->
<!--          <button class="btn new-btn" @click="handleNew">New</button>-->
<!--        </el-tooltip>-->
<!--      </div>-->

<!--      &lt;!&ndash; 表单外的操作按钮：Cache, Inspect, Upload &ndash;&gt;-->
<!--      <div class="external-actions">-->
<!--        <button class="btn cache-btn" @click="handleGlobalCache">Cache</button>-->
<!--        <button class="btn inspect-btn" @click="handleGlobalInspect">Inspect</button>-->
<!--      </div>-->
<!--    </div>-->


<!--    &lt;!&ndash; 数据表格区域 &ndash;&gt;-->
<!--    <table class="data-table">-->
<!--      <thead>-->
<!--      <tr>-->
<!--        <th>Sample ID</th>-->
<!--        <th>Tissue ID</th>-->
<!--        <th>Roll ID</th>-->
<!--        <th>Slice ID</th>-->
<!--        <th>Block ID</th>-->
<!--        <th>Channels</th>-->
<!--        <th>Needles</th>-->
<!--        <th>Status</th>-->
<!--        <th>Injection info</th>-->
<!--        <th>Perfusion / Brightfield</th>-->
<!--        <th>Imaging info</th>-->
<!--      </tr>-->
<!--      </thead>-->
<!--      <tbody>-->
<!--      <tr v-for="(row, index) in filteredData" :key="index">-->
<!--        <td>{{ row.sampleId }}</td>-->
<!--        <td>{{ row.tissueId }}</td>-->
<!--        <td>{{ row.rollId }}</td>-->
<!--        <td>{{ row.sliceId }}</td>-->
<!--        <td>{{ row.blockId }}</td>-->
<!--        <td>{{ row.channels }}</td>-->
<!--        <td>{{ row.needles }}</td>-->
<!--        <td>{{ row.status }}</td>-->
<!--        <td>-->
<!--          <button class="btn small-btn" @click="handleViewEdit(row)">View / Edit</button>-->
<!--        </td>-->
<!--        <td>-->
<!--          <button class="btn" @click="uploadPerfusion(row)">Upload</button>-->
<!--          <button class="btn" @click="downloadPerfusion(row)">Download</button>-->
<!--          <button class="btn" @click="showBrightField(row)">Bright field data</button>-->
<!--        </td>-->
<!--        <td>-->
<!--          <button class="btn imaging-info-btn" @click="openImagingDialog(row)">Imaging info</button>-->
<!--        </td>-->
<!--      </tr>-->
<!--      </tbody>-->
<!--    </table>-->

<!--    &lt;!&ndash; 编辑/新建 数据的Dialog &ndash;&gt;-->
<!--    <el-dialog v-model="editDialogVisible" title="View / Edit Sample" width="600px">-->
<!--      <el-form :model="editForm" label-width="120px">-->
<!--        <el-form-item label="Sample ID">-->
<!--          <el-input v-model="editForm.sampleId"></el-input>-->
<!--        </el-form-item>-->
<!--        <el-form-item label="Tissue ID">-->
<!--          <el-input v-model="editForm.tissueId"></el-input>-->
<!--        </el-form-item>-->
<!--        <el-form-item label="Roll ID">-->
<!--          <el-input v-model="editForm.rollId"></el-input>-->
<!--        </el-form-item>-->
<!--        <el-form-item label="Slice ID">-->
<!--          <el-input v-model="editForm.sliceId"></el-input>-->
<!--        </el-form-item>-->
<!--        <el-form-item label="Block ID">-->
<!--          <el-input v-model="editForm.blockId"></el-input>-->
<!--        </el-form-item>-->
<!--        <el-form-item label="Channels">-->
<!--          <el-input v-model="editForm.channels" type="number"></el-input>-->
<!--        </el-form-item>-->
<!--        <el-form-item label="Needles">-->
<!--          <el-input v-model="editForm.needles" type="number"></el-input>-->
<!--        </el-form-item>-->
<!--        <el-form-item label="Status">-->
<!--          <el-select v-model="editForm.status" placeholder="Select">-->
<!--            <el-option label="Initial" value="Initial"></el-option>-->
<!--            <el-option label="injected" value="injected"></el-option>-->
<!--            <el-option label="imaged" value="imaged"></el-option>-->
<!--            <el-option label="uploaded" value="uploaded"></el-option>-->
<!--          </el-select>-->
<!--        </el-form-item>-->
<!--      </el-form>-->
<!--      <template #footer>-->
<!--        <button class="btn" @click="editDialogVisible = false">Cancel</button>-->
<!--        <button class="btn" @click="saveSampleData">Save</button>-->
<!--      </template>-->
<!--    </el-dialog>-->

<!--    &lt;!&ndash; Imaging Info Dialog &ndash;&gt;-->
<!--    <el-dialog-->
<!--        v-model="showImagingDialog"-->
<!--        title="Imaging Records"-->
<!--        width="80%"-->
<!--        :close-on-click-modal="false"-->
<!--        :close-on-press-escape="false"-->
<!--        @close="closeImagingDialog"-->
<!--    >-->
<!--      <div class="dialog-content">-->
<!--        <div class="new-injection-section">-->
<!--          <el-tooltip-->
<!--              content="new a injection record table"-->
<!--          >-->
<!--            <button class="btn new-btn" @click="newImagingRecord">New</button>-->
<!--          </el-tooltip>-->
<!--        </div>-->
<!--        <div class="imaging-map-section">-->
<!--          <h4>Imaging map (灌注地图, 成像地图)</h4>-->
<!--        </div>-->
<!--        <table class="imaging-table">-->
<!--          <thead>-->
<!--          <tr>-->
<!--            <th>-->
<!--              <input type="checkbox" v-model="imagingSelectAll" @change="toggleSelectAllImaging"/>-->
<!--            </th>-->
<!--            <th>Imaging id</th>-->
<!--            <th>Producer</th>-->
<!--            <th>Status</th>-->
<!--&lt;!&ndash;            <th>Imaged</th>&ndash;&gt;-->
<!--&lt;!&ndash;            <th>Marked</th>&ndash;&gt;-->
<!--            <th>View Options</th>-->
<!--            <th>Upload Files</th>-->
<!--            <th>Upload to Sql</th>-->
<!--          </tr>-->
<!--          </thead>-->
<!--          <tbody>-->
<!--          <tr v-for="(img) in imagingRecords" :key="img.id">-->
<!--            <td>-->
<!--              <input type="checkbox" v-model="selectedImagingIds" :value="img.id"/>-->
<!--            </td>-->
<!--            <td>{{ img.id }}</td>-->
<!--            <td>{{ img.producer }}</td>-->
<!--            <td>{{ img.status }}</td>-->
<!--&lt;!&ndash;            <td><input type="checkbox" v-model="img.imaged" /></td>&ndash;&gt;-->
<!--&lt;!&ndash;            <td><input type="checkbox" v-model="img.marked" /></td>&ndash;&gt;-->
<!--            <td>-->
<!--              <button class="btn" @click="viewEditBlock(img)">View / Edit / download</button>-->
<!--              <button class="btn" @click="imageMIP(img)">Image MIP</button>-->
<!--            </td>-->
<!--            <td>-->
<!--              <button class="btn" @click="showImagingData(img)">Imaging data</button>-->
<!--              <button class="btn" @click="showMetadata(img)">Metadata</button>-->
<!--              <button class="btn" @click="showSomas(img)">Somas (APO)</button>-->
<!--              <button class="btn" @click="showInjectionMatchedTable(img)">Injection matched table</button>-->
<!--            </td>-->
<!--            <td>-->
<!--              <button class="btn" @click="toCell(img)" :disabled="!(img.imaged && img.marked)">To cell</button>-->
<!--            </td>-->
<!--          </tr>-->
<!--          </tbody>-->
<!--        </table>-->
<!--      </div>-->
<!--      <template #footer>-->
<!--        <button class="btn delete-btn" @click="deleteImagingRecords">Delete</button>-->
<!--      </template>-->
<!--    </el-dialog>-->

<!--    &lt;!&ndash; Imaging Block Edit Dialog &ndash;&gt;-->
<!--    <el-dialog v-model="imagingBlockDialogVisible" title="Imaging Block Detail" width="600px">-->
<!--      <el-form :model="imagingBlockForm" label-width="120px">-->
<!--        <el-form-item label="Imaging ID">-->
<!--          <el-input v-model="imagingBlockForm.id"></el-input>-->
<!--        </el-form-item>-->
<!--        <el-form-item label="Producer">-->
<!--          <el-input v-model="imagingBlockForm.producer"></el-input>-->
<!--        </el-form-item>-->
<!--        <el-form-item label="Status">-->
<!--          <el-input v-model="imagingBlockForm.status"></el-input>-->
<!--        </el-form-item>-->
<!--        <el-form-item label="Imaged">-->
<!--          <el-switch v-model="imagingBlockForm.imaged"></el-switch>-->
<!--        </el-form-item>-->
<!--        <el-form-item label="Marked">-->
<!--          <el-switch v-model="imagingBlockForm.marked"></el-switch>-->
<!--        </el-form-item>-->
<!--      </el-form>-->
<!--      <template #footer>-->
<!--        <button class="btn" @click="imagingBlockDialogVisible = false">Cancel</button>-->
<!--        <button class="btn" @click="saveImagingBlock">Save</button>-->
<!--        <button class="btn" @click="downloadImagingBlock">Download</button>-->
<!--      </template>-->
<!--    </el-dialog>-->
<!--  </div>-->
<!--</template>-->

<!--<script setup>-->
<!--import { ref, computed, onMounted } from 'vue'-->
<!--import { ElMessage } from 'element-plus'-->
<!--import SearchPreparation from './Search_for_Preparation.vue';-->

<!--// 搜索参数-->
<!--const searchParams = ref({-->
<!--  sampleId: '',-->
<!--  colorChannel: '',-->
<!--  needleNumber: '',-->
<!--  operator: '',-->
<!--  sliceStatus: ''-->
<!--})-->

<!--// 原始数据-->
<!--const rawData = ref([])-->

<!--// 过滤数据-->
<!--const filteredData = computed(() => {-->
<!--  return rawData.value.filter(item => {-->
<!--    const matchSample = searchParams.value.sampleId ? item.sampleId.includes(searchParams.value.sampleId) : true-->
<!--    const matchChannel = searchParams.value.colorChannel-->
<!--        ? item.channels.toString().includes(searchParams.value.colorChannel)-->
<!--        : true-->
<!--    const matchNeedle = searchParams.value.needleNumber-->
<!--        ? item.needles.toString().includes(searchParams.value.needleNumber)-->
<!--        : true-->
<!--    const matchOperator = searchParams.value.operator-->
<!--        ? (item.operator && item.operator.includes(searchParams.value.operator))-->
<!--        : true-->
<!--    const matchSliceStatus = searchParams.value.sliceStatus-->
<!--        ? item.status.toLowerCase().includes(searchParams.value.sliceStatus.toLowerCase())-->
<!--        : true-->
<!--    return matchSample && matchChannel && matchNeedle && matchOperator && matchSliceStatus-->
<!--  })-->
<!--})-->

<!--// 编辑对话框-->
<!--const editDialogVisible = ref(false)-->
<!--const editForm = ref({-->
<!--  sampleId: '',-->
<!--  tissueId: '',-->
<!--  rollId: '',-->
<!--  sliceId: '',-->
<!--  blockId: '',-->
<!--  channels: 0,-->
<!--  needles: 0,-->
<!--  status: 'Initial'-->
<!--})-->
<!--let isNew = false-->

<!--// Imaging dialog-->
<!--const showImagingDialog = ref(false)-->
<!--const imagingRecords = ref([])-->
<!--const imagingSelectAll = ref(false)-->
<!--const selectedImagingIds = ref([])-->

<!--// Imaging Block Edit Dialog-->
<!--const imagingBlockDialogVisible = ref(false)-->
<!--const imagingBlockForm = ref({})-->

<!--// 初始化获取数据-->
<!--onMounted(() => {-->
<!--  fetchData()-->
<!--})-->


<!--// 3. 从后端获取数据-->
<!--async function fetchData() {-->
<!--  // 假设后端已按PTRSB及时间排序返回数据-->
<!--  const data = [-->
<!--    {-->
<!--      sampleId: 'P00001',-->
<!--      tissueId: 'T001',-->
<!--      rollId: 'R001',-->
<!--      sliceId: 'S001',-->
<!--      blockId: 'B1',-->
<!--      channels: 2,-->
<!--      needles: 4,-->
<!--      status: 'imaged',-->
<!--      operator: 'John'-->
<!--    },-->
<!--    {-->
<!--      sampleId: 'P00002',-->
<!--      tissueId: 'T002',-->
<!--      rollId: 'R002',-->
<!--      sliceId: 'S002',-->
<!--      blockId: 'B2',-->
<!--      channels: 3,-->
<!--      needles: 2,-->
<!--      status: 'Initial',-->
<!--      operator: 'Alice'-->
<!--    }-->
<!--  ]-->
<!--  rawData.value = data-->
<!--}-->

<!--// 4. 新建数据项-->
<!--function handleNew() {-->
<!--  isNew = true-->
<!--  editForm.value = {-->
<!--    sampleId: '',-->
<!--    tissueId: '',-->
<!--    rollId: '',-->
<!--    sliceId: '',-->
<!--    blockId: '',-->
<!--    channels: 0,-->
<!--    needles: 0,-->
<!--    status: 'Initial'-->
<!--  }-->
<!--  editDialogVisible.value = true-->
<!--}-->

<!--// 6. 预览/编辑数据项-->
<!--function handleViewEdit(row) {-->
<!--  isNew = false-->
<!--  editForm.value = { ...row }-->
<!--  editDialogVisible.value = true-->
<!--}-->

<!--async function saveSampleData() {-->
<!--  if (isNew) {-->
<!--    // POST到后端新建-->
<!--    rawData.value.push({ ...editForm.value })-->
<!--    ElMessage.success('New sample added.')-->
<!--  } else {-->
<!--    // 编辑后更新-->
<!--    const index = rawData.value.findIndex(item =>-->
<!--        item.sampleId === editForm.value.sampleId &&-->
<!--        item.tissueId === editForm.value.tissueId &&-->
<!--        item.rollId === editForm.value.rollId &&-->
<!--        item.sliceId === editForm.value.sliceId &&-->
<!--        item.blockId === editForm.value.blockId-->
<!--    )-->
<!--    if (index > -1) {-->
<!--      rawData.value.splice(index, 1, { ...editForm.value })-->
<!--      ElMessage.success('Sample updated.')-->
<!--    }-->
<!--  }-->
<!--  editDialogVisible.value = false-->
<!--}-->

<!--// 5. cache & inspect 上传原始数据（这里仅在全局按钮模拟）-->
<!--function handleGlobalCache() {-->
<!--  ElMessage.info('Global cache action.')-->
<!--}-->

<!--function handleGlobalInspect() {-->
<!--  ElMessage.info('Global inspect action.')-->
<!--}-->

<!--// function handleGlobalUpload() {-->
<!--//   ElMessage.info('Global upload action.')-->
<!--// }-->

<!--// Perfusion和Bright field相关-->
<!--function uploadPerfusion(row) {-->
<!--  console.log('Upload perfusion table for:', row)-->
<!--  // 上传成功后更新状态为imaged(示例)-->
<!--  row.status = 'imaged'-->
<!--}-->
<!--function downloadPerfusion(row) {-->
<!--  console.log('Download perfusion table for:', row)-->
<!--}-->
<!--function showBrightField(row) {-->
<!--  console.log('Show bright field data for:', row)-->
<!--}-->

<!--// 9. 打开imaging dialog-->
<!--function openImagingDialog(row) {-->
<!--  console.log('Open imaging dialog for:', row)-->
<!--  showImagingDialog.value = true-->
<!--  fetchImagingRecords()-->
<!--}-->

<!--function closeImagingDialog() {-->
<!--  showImagingDialog.value = false-->
<!--  selectedImagingIds.value = []-->
<!--}-->

<!--// 模拟获取imaging信息-->
<!--function fetchImagingRecords() {-->
<!--  imagingRecords.value = [-->
<!--    {-->
<!--      id: 1,-->
<!--      producer: 'xxx',-->
<!--      status: 'imaged',-->
<!--      imaged: true,-->
<!--      marked: true-->
<!--    },-->
<!--    {-->
<!--      id: 2,-->
<!--      producer: 'yyy',-->
<!--      status: 'marked',-->
<!--      imaged: true,-->
<!--      marked: false-->
<!--    }-->
<!--  ]-->
<!--}-->

<!--// 10. 图像块表单的预览、编辑和下载功能-->
<!--function viewEditBlock(img) {-->
<!--  imagingBlockForm.value = { ...img }-->
<!--  imagingBlockDialogVisible.value = true-->
<!--}-->

<!--function saveImagingBlock() {-->
<!--  // 保存编辑后的block-->
<!--  const index = imagingRecords.value.findIndex(record => record.id === imagingBlockForm.value.id)-->
<!--  if (index > -1) {-->
<!--    imagingRecords.value.splice(index, 1, { ...imagingBlockForm.value })-->
<!--    ElMessage.success('Imaging block updated.')-->
<!--  } else {-->
<!--    imagingRecords.value.push({ ...imagingBlockForm.value })-->
<!--    ElMessage.success('Imaging block added.')-->
<!--  }-->
<!--  imagingBlockDialogVisible.value = false-->
<!--}-->

<!--function downloadImagingBlock() {-->
<!--  console.log('Download imaging block data for:', imagingBlockForm.value)-->
<!--}-->

<!--// MIP, imaging data, metadata, somas, injection matched table等功能-->
<!--function imageMIP(img) {-->
<!--  console.log('Image MIP:', img)-->
<!--}-->
<!--function showImagingData(img) {-->
<!--  console.log('Show imaging data:', img)-->
<!--}-->
<!--function showMetadata(img) {-->
<!--  console.log('Show metadata:', img)-->
<!--}-->
<!--function showSomas(img) {-->
<!--  console.log('Show Somas (APO):', img)-->
<!--}-->
<!--function showInjectionMatchedTable(img) {-->
<!--  console.log('Show injection matched table:', img)-->
<!--}-->
<!--function toCell(img) {-->
<!--  console.log('To cell action:', img)-->
<!--  // 若imaged和marked都为true，才可执行此操作-->
<!--}-->

<!--// 11. imaging info dialog中的new和delete-->
<!--function newImagingRecord() {-->
<!--  // 新增空的imaging record-->
<!--  imagingRecords.value.push({-->
<!--    id: Date.now(),-->
<!--    producer: '',-->
<!--    status: 'Initial',-->
<!--    imaged: false,-->
<!--    marked: false-->
<!--  })-->
<!--}-->

<!--function deleteImagingRecords() {-->
<!--  if (selectedImagingIds.value.length === 0) {-->
<!--    ElMessage.warning('No records selected.')-->
<!--    return-->
<!--  }-->
<!--  imagingRecords.value = imagingRecords.value.filter(record => !selectedImagingIds.value.includes(record.id))-->
<!--  selectedImagingIds.value = []-->
<!--  imagingSelectAll.value = false-->
<!--  ElMessage.success('Selected imaging records deleted.')-->
<!--}-->

<!--// 全选/反选-->
<!--function toggleSelectAllImaging() {-->
<!--  if (imagingSelectAll.value) {-->
<!--    selectedImagingIds.value = imagingRecords.value.map(r => r.id)-->
<!--  } else {-->
<!--    selectedImagingIds.value = []-->
<!--  }-->
<!--}-->
<!--</script>-->

<!--<style scoped>-->
<!--.container {-->
<!--  padding: 16px;-->
<!--  font-family: sans-serif;-->
<!--}-->

<!--.search-bar {-->
<!--  background: #fff;-->
<!--  padding: 16px;-->
<!--  border-radius: 8px;-->
<!--}-->

<!--.search-fields {-->
<!--  display: flex;-->
<!--  gap: 16px;-->
<!--  margin-bottom: 8px;-->
<!--  flex-wrap: wrap;-->
<!--}-->

<!--.search-field {-->
<!--  display: flex;-->
<!--  flex-direction: column;-->
<!--}-->

<!--.btn {-->
<!--  border: none;-->
<!--  border-radius: 6px;-->
<!--  padding: 6px 12px;-->
<!--  cursor: pointer;-->
<!--  margin: 4px;-->
<!--  background: #ddd;-->
<!--}-->

<!--.new-btn {-->
<!--  background: #f99;-->
<!--}-->

<!--.data-table {-->
<!--  width: 100%;-->
<!--  border-collapse: collapse;-->
<!--  margin-top: 16px;-->
<!--}-->

<!--.data-table th, .data-table td {-->
<!--  border: 1px solid #ccc;-->
<!--  padding: 8px;-->
<!--  text-align: left;-->
<!--}-->

<!--.external-actions {-->
<!--  margin-top: 10px;-->
<!--}-->

<!--.cache-btn {-->
<!--  background: #9f9;-->
<!--}-->

<!--.inspect-btn {-->
<!--  background: #9ff;-->
<!--}-->

<!--.upload-btn {-->
<!--  background: #9f9;-->
<!--}-->

<!--.imaging-info-btn {-->
<!--  background: #9ef;-->
<!--}-->

<!--.new-injection-section {-->
<!--  margin-top: 16px;-->
<!--  display: flex;-->
<!--  align-items: center;-->
<!--}-->

<!--/* dialog styling由el-dialog提供基本样式，这里扩展内部表格、按钮布局 */-->
<!--.dialog-content {-->
<!--  padding: 16px;-->
<!--}-->

<!--.delete-btn {-->
<!--  background: #f66;-->
<!--}-->

<!--.imaging-map-section {-->
<!--  margin: 16px 0;-->
<!--}-->

<!--.imaging-table {-->
<!--  width: 100%;-->
<!--  border-collapse: collapse;-->
<!--}-->

<!--.imaging-table th, .imaging-table td {-->
<!--  border: 1px solid #999;-->
<!--  padding: 8px;-->
<!--  text-align: left;-->
<!--}-->
<!--</style>-->