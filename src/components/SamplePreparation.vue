<template>
  <div class="container">
    <!-- 搜索框区域 -->
<!--    <div class="search-bar">-->
<!--      <h2>Search</h2>-->
<!--      <div class="search-fields">-->
<!--        <div class="search-field">-->
<!--          <label>Sample ID</label>-->
<!--          <input v-model="searchParams.sampleId" placeholder="Input sample ID" />-->
<!--        </div>-->
<!--        <div class="search-field">-->
<!--          <label>Color Channel</label>-->
<!--          <input v-model="searchParams.colorChannel" placeholder="Input color channel" />-->
<!--        </div>-->
<!--        <div class="search-field">-->
<!--          <label>Needle number</label>-->
<!--          <input v-model="searchParams.needleNumber" placeholder="Input needle number" />-->
<!--        </div>-->
<!--        <div class="search-field">-->
<!--          <label>Operator (injection)</label>-->
<!--          <input v-model="searchParams.operator" placeholder="Input operator" />-->
<!--        </div>-->
<!--        <div class="search-field">-->
<!--          <label>Slice status</label>-->
<!--          <input v-model="searchParams.sliceStatus" placeholder="Input slice status" />-->
<!--        </div>-->
<!--      </div>-->
<!--      <button @click="onSearch" class="btn">Search</button>-->
<!--    </div>-->

    <!-- 新建 Injection 记录 -->
    <div class="new-injection-section">
      <button class="btn new-btn" @click="newInjection">New</button>
      <span>new a injection record table</span>
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
      <tr v-for="(row, index) in tableData" :key="index">
        <td>{{ row.sampleId }}</td>
        <td>{{ row.tissueId }}</td>
        <td>{{ row.rollId }}</td>
        <td>{{ row.sliceId }}</td>
        <td>{{ row.blockId }}</td>
        <td>{{ row.channels }}</td>
        <td>{{ row.needles }}</td>
        <td>{{ row.status }}</td>
        <td>
          <button class="btn small-btn" @click="viewEditInjection(row)">View / Edit</button>
        </td>
        <td class="injection-files-cell">
          <button class="btn cache-btn">Cache</button>
          <button class="btn inspect-btn">Inspect</button>
          <button class="btn upload-btn">Upload</button>
          <div class="injection-sub-actions">
            <button class="btn" @click="uploadInjection(row)">Upload</button>
            <button class="btn" @click="downloadInjection(row)">Download</button>
            <button class="btn" @click="showBrightField(row)">Bright field data</button>
          </div>
        </td>
        <td>
          <button class="btn imaging-info-btn" @click="openImagingDialog(row)">Imaging info</button>
        </td>
      </tr>
      </tbody>
    </table>

    <!-- Imaging Info Dialog -->
    <div v-if="showImagingDialog" class="dialog-mask">
      <div class="dialog">
        <div class="dialog-header">
          <h3>Imaging Records</h3>
          <button class="close-btn" @click="closeImagingDialog">X</button>
        </div>
        <div class="dialog-content">
          <button class="btn new-btn" @click="newImagingRecord">New</button>
          <span>new a imaging record</span>
          <div class="imaging-map-section">
            <h4>Imaging map (灌注地图, 成像地图)</h4>
          </div>
          <table class="imaging-table">
            <thead>
            <tr>
              <th>Imaging id</th>
              <th>Producer</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(img, idx) in imagingRecords" :key="idx">
              <td>{{ img.id }}</td>
              <td>{{ img.producer }}</td>
              <td>{{ img.status }}</td>
              <td>
                <button class="btn" @click="viewEditDownload(img)">View / Edit / download</button>
                <button class="btn" @click="imageMIP(img)">Image MIP</button>
                <button class="btn" @click="showImagingData(img)">Imaging data</button>
                <button class="btn" @click="showMetadata(img)">Metadata</button>
                <button class="btn" @click="showSomas(img)">Somas (APO)</button>
                <button class="btn" @click="showInjectionMatchedTable(img)">Injection matched table</button>
                <button class="btn" @click="toCell(img)">To cell</button>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
        <div class="dialog-footer">
          <button class="btn delete-btn" @click="deleteRecord">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const searchParams = ref({
  sampleId: '',
  colorChannel: '',
  needleNumber: '',
  operator: '',
  sliceStatus: ''
})

const tableData = ref([
  {
    sampleId: 'P00001',
    tissueId: 'T001',
    rollId: 'R001',
    sliceId: 'S001',
    blockId: 'B1',
    channels: 2,
    needles: 4,
    status: 'imaged'
  }
])

const showImagingDialog = ref(false)
const imagingRecords = ref([
  {
    id: 1,
    producer: 'xxx',
    status: 'imaged'
  }
])

function onSearch() {
  // 执行搜索逻辑，根据 searchParams 获取数据
  console.log('Searching with params:', searchParams.value)
}

function newInjection() {
  // 新建injection记录逻辑
  console.log('New Injection')
}

function viewEditInjection(row) {
  // 查看或编辑 injection 记录
  console.log('View/Edit injection record:', row)
}

function uploadInjection(row) {
  console.log('Upload injection files for:', row)
}

function downloadInjection(row) {
  console.log('Download injection files for:', row)
}

function showBrightField(row) {
  console.log('Show bright field data for:', row)
}

function openImagingDialog(row) {
  console.log('Open imaging dialog for:', row)
  showImagingDialog.value = true
}

function closeImagingDialog() {
  showImagingDialog.value = false
}

function newImagingRecord() {
  console.log('New imaging record')
}

function viewEditDownload(img) {
  console.log('View/Edit/Download imaging:', img)
}

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
}

function deleteRecord() {
  console.log('Delete imaging record')
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
  background: #fce9e9;
}

.data-table th, .data-table td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: left;
}

.injection-files-cell {
  vertical-align: top;
}

.injection-sub-actions {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
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

/* Dialog styling */
.dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.3);
  display: flex;
  justify-content: center;
  align-items: center;
}

.dialog {
  background: #ccf;
  padding: 16px;
  border-radius: 8px;
  width: 80%;
  max-width: 800px;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  background: #f88;
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

.dialog-footer {
  margin-top: 16px;
  text-align: right;
}

.delete-btn {
  background: #f66;
}
</style>