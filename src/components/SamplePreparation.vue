<template>
  <div class="container">
    <!-- 搜索框区域 -->
    <div class="search-bar">
      <h2>Search</h2>
      <div class="search-fields">
        <div class="search-field">
          <label>Sample ID</label>
          <input v-model="searchParams.sampleId" placeholder="Input sample ID" />
        </div>
        <div class="search-field">
          <label>Color Channel</label>
          <input v-model="searchParams.colorChannel" placeholder="Input color channel" />
        </div>
        <div class="search-field">
          <label>Needle number</label>
          <input v-model="searchParams.needleNumber" placeholder="Input needle number" />
        </div>
        <div class="search-field">
          <label>Operator (injection)</label>
          <input v-model="searchParams.operator" placeholder="Input operator" />
        </div>
        <div class="search-field">
          <label>Slice status</label>
          <input v-model="searchParams.sliceStatus" placeholder="Input slice status" />
        </div>
      </div>
      <button @click="onSearch" class="btn">Search</button>
    </div>

    <div style="display: flex;justify-content: space-between;align-items: center;">
      <div class="new-injection-section">
        <el-tooltip
          content="new a injection record table"
        >
          <button class="btn new-btn" @click="handleNew">New</button>
        </el-tooltip>
      </div>

      <!-- 表单外的操作按钮：Cache, Inspect, Upload -->
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
      <tr v-for="(row, index) in filteredData" :key="index">
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
            <el-option label="Initial" value="Initial"></el-option>
            <el-option label="injected" value="injected"></el-option>
            <el-option label="imaged" value="imaged"></el-option>
            <el-option label="uploaded" value="uploaded"></el-option>
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
          <el-tooltip
              content="new a injection record table"
          >
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
              <input type="checkbox" v-model="imagingSelectAll" @change="toggleSelectAllImaging"/>
            </th>
            <th>Imaging id</th>
            <th>Producer</th>
            <th>Status</th>
<!--            <th>Imaged</th>-->
<!--            <th>Marked</th>-->
            <th>View Options</th>
            <th>Upload Files</th>
            <th>Upload to Sql</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(img) in imagingRecords" :key="img.id">
            <td>
              <input type="checkbox" v-model="selectedImagingIds" :value="img.id"/>
            </td>
            <td>{{ img.id }}</td>
            <td>{{ img.producer }}</td>
            <td>{{ img.status }}</td>
<!--            <td><input type="checkbox" v-model="img.imaged" /></td>-->
<!--            <td><input type="checkbox" v-model="img.marked" /></td>-->
            <td>
              <button class="btn" @click="viewEditBlock(img)">View / Edit / download</button>
              <button class="btn" @click="imageMIP(img)">Image MIP</button>
            </td>
            <td>
              <button class="btn" @click="showImagingData(img)">Imaging data</button>
              <button class="btn" @click="showMetadata(img)">Metadata</button>
              <button class="btn" @click="showSomas(img)">Somas (APO)</button>
              <button class="btn" @click="showInjectionMatchedTable(img)">Injection matched table</button>
            </td>
            <td>
              <button class="btn" @click="toCell(img)" :disabled="!(img.imaged && img.marked)">To cell</button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
      <template #footer>
        <button class="btn delete-btn" @click="deleteImagingRecords">Delete</button>
      </template>
    </el-dialog>

    <!-- Imaging Block Edit Dialog -->
    <el-dialog v-model="imagingBlockDialogVisible" title="Imaging Block Detail" width="600px">
      <el-form :model="imagingBlockForm" label-width="120px">
        <el-form-item label="Imaging ID">
          <el-input v-model="imagingBlockForm.id"></el-input>
        </el-form-item>
        <el-form-item label="Producer">
          <el-input v-model="imagingBlockForm.producer"></el-input>
        </el-form-item>
        <el-form-item label="Status">
          <el-input v-model="imagingBlockForm.status"></el-input>
        </el-form-item>
        <el-form-item label="Imaged">
          <el-switch v-model="imagingBlockForm.imaged"></el-switch>
        </el-form-item>
        <el-form-item label="Marked">
          <el-switch v-model="imagingBlockForm.marked"></el-switch>
        </el-form-item>
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
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 搜索参数
const searchParams = ref({
  sampleId: '',
  colorChannel: '',
  needleNumber: '',
  operator: '',
  sliceStatus: ''
})

// 原始数据
const rawData = ref([])

// 过滤数据
const filteredData = computed(() => {
  return rawData.value.filter(item => {
    const matchSample = searchParams.value.sampleId ? item.sampleId.includes(searchParams.value.sampleId) : true
    const matchChannel = searchParams.value.colorChannel
        ? item.channels.toString().includes(searchParams.value.colorChannel)
        : true
    const matchNeedle = searchParams.value.needleNumber
        ? item.needles.toString().includes(searchParams.value.needleNumber)
        : true
    const matchOperator = searchParams.value.operator
        ? (item.operator && item.operator.includes(searchParams.value.operator))
        : true
    const matchSliceStatus = searchParams.value.sliceStatus
        ? item.status.toLowerCase().includes(searchParams.value.sliceStatus.toLowerCase())
        : true
    return matchSample && matchChannel && matchNeedle && matchOperator && matchSliceStatus
  })
})

// 编辑对话框
const editDialogVisible = ref(false)
const editForm = ref({
  sampleId: '',
  tissueId: '',
  rollId: '',
  sliceId: '',
  blockId: '',
  channels: 0,
  needles: 0,
  status: 'Initial'
})
let isNew = false

// Imaging dialog
const showImagingDialog = ref(false)
const imagingRecords = ref([])
const imagingSelectAll = ref(false)
const selectedImagingIds = ref([])

// Imaging Block Edit Dialog
const imagingBlockDialogVisible = ref(false)
const imagingBlockForm = ref({})

// 初始化获取数据
onMounted(() => {
  fetchData()
})

// 1. 搜索逻辑（前端过滤或调用后端API）
function onSearch() {
  console.log('Searching with params:', searchParams.value)
  // 实际可调用后端API来搜索
}

// 3. 从后端获取数据
async function fetchData() {
  // 假设后端已按PTRSB及时间排序返回数据
  const data = [
    {
      sampleId: 'P00001',
      tissueId: 'T001',
      rollId: 'R001',
      sliceId: 'S001',
      blockId: 'B1',
      channels: 2,
      needles: 4,
      status: 'imaged',
      operator: 'John'
    },
    {
      sampleId: 'P00002',
      tissueId: 'T002',
      rollId: 'R002',
      sliceId: 'S002',
      blockId: 'B2',
      channels: 3,
      needles: 2,
      status: 'Initial',
      operator: 'Alice'
    }
  ]
  rawData.value = data
}

// 4. 新建数据项
function handleNew() {
  isNew = true
  editForm.value = {
    sampleId: '',
    tissueId: '',
    rollId: '',
    sliceId: '',
    blockId: '',
    channels: 0,
    needles: 0,
    status: 'Initial'
  }
  editDialogVisible.value = true
}

// 6. 预览/编辑数据项
function handleViewEdit(row) {
  isNew = false
  editForm.value = { ...row }
  editDialogVisible.value = true
}

async function saveSampleData() {
  if (isNew) {
    // POST到后端新建
    rawData.value.push({ ...editForm.value })
    ElMessage.success('New sample added.')
  } else {
    // 编辑后更新
    const index = rawData.value.findIndex(item =>
        item.sampleId === editForm.value.sampleId &&
        item.tissueId === editForm.value.tissueId &&
        item.rollId === editForm.value.rollId &&
        item.sliceId === editForm.value.sliceId &&
        item.blockId === editForm.value.blockId
    )
    if (index > -1) {
      rawData.value.splice(index, 1, { ...editForm.value })
      ElMessage.success('Sample updated.')
    }
  }
  editDialogVisible.value = false
}

// 5. cache & inspect 上传原始数据（这里仅在全局按钮模拟）
function handleGlobalCache() {
  ElMessage.info('Global cache action.')
}

function handleGlobalInspect() {
  ElMessage.info('Global inspect action.')
}

// function handleGlobalUpload() {
//   ElMessage.info('Global upload action.')
// }

// Perfusion和Bright field相关
function uploadPerfusion(row) {
  console.log('Upload perfusion table for:', row)
  // 上传成功后更新状态为imaged(示例)
  row.status = 'imaged'
}
function downloadPerfusion(row) {
  console.log('Download perfusion table for:', row)
}
function showBrightField(row) {
  console.log('Show bright field data for:', row)
}

// 9. 打开imaging dialog
function openImagingDialog(row) {
  console.log('Open imaging dialog for:', row)
  showImagingDialog.value = true
  fetchImagingRecords()
}

function closeImagingDialog() {
  showImagingDialog.value = false
  selectedImagingIds.value = []
}

// 模拟获取imaging信息
function fetchImagingRecords() {
  imagingRecords.value = [
    {
      id: 1,
      producer: 'xxx',
      status: 'imaged',
      imaged: true,
      marked: true
    },
    {
      id: 2,
      producer: 'yyy',
      status: 'marked',
      imaged: true,
      marked: false
    }
  ]
}

// 10. 图像块表单的预览、编辑和下载功能
function viewEditBlock(img) {
  imagingBlockForm.value = { ...img }
  imagingBlockDialogVisible.value = true
}

function saveImagingBlock() {
  // 保存编辑后的block
  const index = imagingRecords.value.findIndex(record => record.id === imagingBlockForm.value.id)
  if (index > -1) {
    imagingRecords.value.splice(index, 1, { ...imagingBlockForm.value })
    ElMessage.success('Imaging block updated.')
  } else {
    imagingRecords.value.push({ ...imagingBlockForm.value })
    ElMessage.success('Imaging block added.')
  }
  imagingBlockDialogVisible.value = false
}

function downloadImagingBlock() {
  console.log('Download imaging block data for:', imagingBlockForm.value)
}

// MIP, imaging data, metadata, somas, injection matched table等功能
function imageMIP(img) {
  console.log('Image MIP:', img)
}
function showImagingData(img) {
  console.log('Show imaging data:', img)
}
function showMetadata(img) {
  console.log('Show metadata:', img)
}
function showSomas(img) {
  console.log('Show Somas (APO):', img)
}
function showInjectionMatchedTable(img) {
  console.log('Show injection matched table:', img)
}
function toCell(img) {
  console.log('To cell action:', img)
  // 若imaged和marked都为true，才可执行此操作
}

// 11. imaging info dialog中的new和delete
function newImagingRecord() {
  // 新增空的imaging record
  imagingRecords.value.push({
    id: Date.now(),
    producer: '',
    status: 'Initial',
    imaged: false,
    marked: false
  })
}

function deleteImagingRecords() {
  if (selectedImagingIds.value.length === 0) {
    ElMessage.warning('No records selected.')
    return
  }
  imagingRecords.value = imagingRecords.value.filter(record => !selectedImagingIds.value.includes(record.id))
  selectedImagingIds.value = []
  imagingSelectAll.value = false
  ElMessage.success('Selected imaging records deleted.')
}

// 全选/反选
function toggleSelectAllImaging() {
  if (imagingSelectAll.value) {
    selectedImagingIds.value = imagingRecords.value.map(r => r.id)
  } else {
    selectedImagingIds.value = []
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

.data-table th, .data-table td {
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

/* dialog styling由el-dialog提供基本样式，这里扩展内部表格、按钮布局 */
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

.imaging-table th, .imaging-table td {
  border: 1px solid #999;
  padding: 8px;
  text-align: left;
}
</style>