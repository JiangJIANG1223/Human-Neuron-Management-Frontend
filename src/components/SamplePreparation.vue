<template>
  <div class="container">
    <el-card class="search-box-card" shadow="hover">
      <el-collapse v-model='isExpanded'>
        <el-collapse-item name="1">
          <template #title>
            <span class="search-title">Search Injections</span>
          </template>
          <el-form ref="searchForm" :model="searchQuery" label-width="150px" class="custom-box-content">
            <el-row :gutter="20">
              <el-col :span="6">
                <el-form-item label="Patient ID">
                  <el-input v-model="searchQuery.sampleId" placeholder="Enter Patient ID"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="Tissue ID">
                  <el-input v-model="searchQuery.tissueId" placeholder="Enter Tissue ID"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="Roll ID">
                  <el-input v-model="searchQuery.rollId" placeholder="Enter Roll ID"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="Slice ID">
                  <el-input v-model="searchQuery.sliceId" placeholder="Enter Slice ID"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="Sample Status">
                  <el-select
                      v-model="searchQuery.status"
                      multiple
                      clearable
                      placeholder="Select the status"
                  >
                    <el-option label="injected" value="injected"></el-option>
                    <el-option label="imaged" value="imaged"></el-option>
                    <el-option label="marked" value="marked"></el-option>
                    <el-option label="inserted" value="inserted"></el-option>
                    <el-option label="matched" value="matched"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
              <el-form-item label="Sample Comment">
                <el-select
                    v-model="searchQuery.comment"
                    placeholder="Select the comment status"
                    clearable
                >
                  <el-option label="With comment" value="true"></el-option>
                  <el-option label="None" value="false"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
              <el-col :span="6">
                <el-form-item label="Dyes">
                  <el-select
                      v-model="searchQuery.dyes"
                      multiple
                      clearable
                      placeholder="Select the number of dyes"
                  >
                    <el-option label="1" value="1"></el-option>
                    <el-option label="2" value="2"></el-option>
                    <el-option label="3" value="3"></el-option>
                    <el-option label="4" value="4"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="Needles">
                  <el-select
                      v-model="searchQuery.needles"
                      multiple
                      clearable
                      placeholder="Select the number of needles"
                  >
                    <el-option label="1" value="1"></el-option>
                    <el-option label="2" value="2"></el-option>
                    <el-option label="3" value="3"></el-option>
                    <el-option label="4" value="4"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-col :span="24" class="button-group">
              <el-button type="primary" @click="search" style="margin-left: 10px;">Search</el-button>
              <el-button type="default" @click="resetSearch" style="margin-left: 10px;">Reset</el-button>
            </el-col>
          </el-form>
        </el-collapse-item>
      </el-collapse>
    </el-card>
    <div style="display: flex; justify-content: space-between;">
      <div>
        <el-tooltip content="新建注射记录表">
          <el-button type="primary" class="btn" @click="handleNew" :disabled="isGuest">New</el-button>
        </el-tooltip>
      </div>

      <!-- 表单外的操作按钮：Cache, Inspect -->
      <el-button type="primary" class="btn" @click="openInjectionFilesDialog" :disabled="isGuest">Injection Files</el-button>
    </div>
    <table class="data-table">
      <thead>
      <tr>
        <th>Patient ID</th>
        <th>Tissue ID</th>
        <th>Roll ID</th>
        <th>Slice ID</th>
        <th>Block ID</th>
        <th>Injected</th>
        <th>Status</th>
        <th>Injection info</th>
        <th>Injection files</th>
        <th>Imaging info</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(row) in paginatedData" :key="row.id">
        <td>{{ row.sampleId }}</td>
        <td>{{ row.tissueId }}</td>
        <td>{{ row.rollId }}</td>
        <td>{{ row.sliceId }}</td>
        <td>{{ row.blockId }}</td>
        <td>{{ row.injected_num }}</td>
        <td>{{ row.status }}</td>
        <td>
          <el-button type="primary" class="btn" @click="handleViewEdit(row)">View / Edit</el-button>
        </td>
        <td>
          <el-tooltip content="replace the injection file">
            <el-button
                type="primary"
                class="btn"
                :disabled="isGuest || row.imaging_records.length > 0 || row.status !== 'injected'"
                @click="uploadInjection(row)"
            >
              Upload
            </el-button>
          </el-tooltip>
          <el-button type="primary" class="btn" @click="downloadInjection(row)" :disabled="isGuest">Download</el-button>
          <el-button type="primary" class="btn" @click="uploadBrightField(row)" :disabled="isGuest">Bright field data</el-button>
        </td>
        <td>
          <el-button type="primary" class="btn" @click="openImagingDialog(row)">Imaging info</el-button>
        </td>
      </tr>
      </tbody>
    </table>

    <!-- 分页组件 -->
    <el-pagination
        @current-change="handlePageChange"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="filteredData.length"
        layout="prev, pager, next"
        class="pagination"
    />
    <el-dialog v-model="editDialogVisible" title="View / Edit Sample" width="600px">
      <el-form :model="editForm" label-width="120px">
        <!-- Patient ID（只读） -->
        <el-form-item label="Patient ID">
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
        <!-- Status（只读） -->
        <el-form-item label="Status">
          <el-input v-model="editForm.status" disabled></el-input>
        </el-form-item>
        <el-form-item label="Injected Number">
          <el-input v-model="editForm.injected_num" disabled></el-input>
        </el-form-item>
        <el-form-item label="Dyes Number">
          <el-input v-model="editForm.dyes" disabled></el-input>
        </el-form-item>
        <el-form-item label="Dyes Name">
          <el-input v-model="editForm.dye_name" disabled></el-input>
        </el-form-item>
        <el-form-item label="Needles Number">
          <el-input v-model="editForm.needles" disabled></el-input>
        </el-form-item>
        <el-form-item label="Perfusion User">
          <el-input v-model="editForm.perfusion_user" disabled></el-input>
        </el-form-item>
        <el-form-item label="Perfusion Date">
          <el-input v-model="editForm.perfusion_date" disabled></el-input>
        </el-form-item>
        <el-form-item label="Comment">
          <el-input v-model="editForm.comment" type="text"></el-input>
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

<!--        &lt;!&ndash; Channels &ndash;&gt;-->
<!--        <el-form-item label="Channels Number">-->
<!--          <el-input v-model.number="editForm.channels" type="number" placeholder="Enter channels number" />-->
<!--        </el-form-item>-->

<!--        &lt;!&ndash; Needles &ndash;&gt;-->
<!--        <el-form-item label="Needles Number">-->
<!--          <el-input v-model.number="editForm.needles" type="number" placeholder="Enter needles number" />-->
<!--        </el-form-item>-->
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
        <el-button @click="cancelUploadImage">Cancel</el-button>
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
            <el-button type="primary" class="btn" @click="handleNewImagingRecord" :disabled="isGuest">New</el-button>
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
<!--            <th>Channels</th>-->
<!--            <th>Z_Size</th>-->
<!--            <th>Y_Size</th>-->
<!--            <th>X_Size</th>-->
<!--            <th>File_Size_GB</th>-->
            <th>View Options</th>
            <th>Upload & Download</th>
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
<!--            <td>{{ img.Channels }}</td>-->
<!--            <td>{{ img.Z_Size }}</td>-->
<!--            <td>{{ img.Y_Size }}</td>-->
<!--            <td>{{ img.X_Size }}</td>-->
<!--            <td>{{ img.File_Size_GB }}</td>-->
            <td>
              <el-button type="primary" class="btn" @click="viewEditBlock(img)">View</el-button>
              <el-button type="primary" class="btn" @click="imageMIP(img)">Image MIP</el-button>
            </td>
            <td>
              <el-button type="primary" class="btn" @click="uploadImagingData(img)" :disabled="isGuest">Imaging data</el-button>
              <el-button type="primary" class="btn" @click="uploadImagingMetadata(img)" :disabled="isGuest">Metadata</el-button>
              <el-button type="primary" class="btn" @click="uploadImagingMarker(img)" :disabled="isGuest">Soma</el-button>
              <el-button type="primary" class="btn" @click="uploadImagingMatchTable(img)" :disabled="isGuest">Injection matched table</el-button>
              <el-button type="primary" class="btn" @click="downloadImagingFiles(img)" :disabled="isGuest">Download</el-button>
            </td>
            <td>
              <el-button type="primary" class="btn" @click="toCell(img)" :disabled="!(img.status === 'imaged' && img.marked)">To cell</el-button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
      <template #footer>
        <div style="display: flex; justify-content: space-between; width: 100%;">
          <el-button type="danger" class="btn" @click="deleteImagingRecords" :disabled="isGuest || isDeleteDisabled">Delete</el-button>
          <el-button type="primary" class="btn" @click="saveImagingRecords" :disabled="isGuest">Save</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Imaging Block Edit Dialog -->
    <el-dialog v-model="editImageDialogVisible" title="Imaging Block Detail" width="600px">
      <el-form :model="imagingBlockForm" label-width="120px">
        <el-form-item label="Imaging ID">
          <el-input v-model="imagingBlockForm.imaging_id" disabled></el-input>
        </el-form-item>
        <el-form-item label="Producer">
          <el-input v-model="imagingBlockForm.producer" disabled></el-input>
        </el-form-item>
        <el-form-item label="Status">
          <el-input v-model="imagingBlockForm.status" disabled></el-input>
        </el-form-item>
        <el-form-item label="Dyes">
          <el-input v-model="imagingBlockForm.Dyes" disabled></el-input>
        </el-form-item>
        <el-form-item label="Z_Size">
          <el-input v-model="imagingBlockForm.Z_Size" disabled></el-input>
        </el-form-item>
        <el-form-item label="Y_Size">
          <el-input v-model="imagingBlockForm.Y_Size" disabled></el-input>
        </el-form-item>
        <el-form-item label="X_Size">
          <el-input v-model="imagingBlockForm.X_Size" disabled></el-input>
        </el-form-item>
        <el-form-item label="File_Size_GB">
          <el-input v-model="imagingBlockForm.File_Size_GB" disabled></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <button class="btn" @click="editImageDialogVisible = false">Cancel</button>
<!--        <button class="btn" @click="saveImagingBlock">Save</button>-->
<!--        <button class="btn" @click="downloadImagingBlock" :disabled="isGuest">Download</button>-->
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
            :disabled="isGuest || metadataFilesList.length === 0">
          Upload
        </el-button>
        <el-button @click="imagingMetadataDialogVisible = false">Cancel</el-button>
      </template>
    </el-dialog>
    <el-dialog title="Upload Imaging Annotation File" v-model="imagingMarkerDialogVisible" width="50%">
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
          <div class="el-upload__text">Drag .apo file here or click to upload</div>
        </el-upload>
      </el-form>
      <!-- Upload Button -->
      <template #footer>
        <el-button
            type="primary"
            @click="uploadImagingAnnotationFiles"
            :disabled="isGuest || markerFilesList.length === 0">
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
            :disabled="isGuest || matchTableFilesList.length === 0">
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
        <el-button type="primary" class="btn" @click="openUploadImagingMapFile" :disabled="isGuest">Upload/Replace</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="uploadImagingMapVisible" width="50%">
      <template #title>
        Upload Imaging Map of {{ currentSampleId }}
      </template>
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
    <el-dialog title="" v-model="uploadImagingDataVisible" width="50%">
      <template #title>
        Upload Imaging Data of {{ currentSampleId }}
      </template>
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
    <el-dialog v-model="uploadBrightFieldDataVisible" width="50%">
      <template #title>
        Upload Bright Field Data of {{ currentSampleId }}
      </template>
      <el-form label-width="150px">
        <el-upload
            class="upload-demo"
            multiple
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
    <el-dialog v-model="uploadInjectionFileVisible" width="50%">
      <template #title>
        Upload Injection FIle of {{ currentSampleId }}
      </template>
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
import axios from '@/axios';

// 配置 Axios 实例
// const axios = axios.create({
//   baseURL: 'http://localhost:8000/api', // 根据实际情况修改
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// eslint-disable-next-line no-undef
defineProps({
  isGuest: Boolean,
});
// 原始数据
const rawData = ref([]);
const filteredData = computed(() => {
  const searchQueryValue = searchQuery.value;

  return rawData.value.filter((row) => {
    // 提前解构查询条件，避免每次都访问 `searchQuery.value`
    const {
      sampleId,
      tissueId,
      rollId,
      sliceId,
      status,
      comment,
      dyes,
      needles
    } = searchQueryValue;

    // 提前判断是否需要进行某个字段的检查
    const hasSampleId = !!sampleId;
    const hasTissueId = !!tissueId;
    const hasRollId = !!rollId;
    const hasSliceId = !!sliceId;
    const hasStatus = Array.isArray(status) && status.length > 0;
    const hasComment = comment !== undefined;
    const hasDyes = Array.isArray(dyes) && dyes.length > 0;
    const hasNeedles = Array.isArray(needles) && needles.length > 0;


    // 处理 sampleId 的匹配
    if (hasSampleId && !row.sampleId.includes(sampleId)) return false;

    // 处理 tissueId 的匹配
    if (hasTissueId && !row.tissueId.includes(tissueId)) return false;

    // 处理 rollId 的匹配
    if (hasRollId && !row.rollId.includes(rollId)) return false;

    // 处理 sliceId 的匹配
    if (hasSliceId && !row.sliceId.includes(sliceId)) return false;

    // 处理 status 的匹配
    if (hasStatus) {
      const rowStatusArray =
          Array.isArray(row.status) ? row.status : [row.status];
      if (!rowStatusArray.some((item) => status.includes(item))) return false;
    }

    // 处理 comment 的匹配
    if (hasComment) {
      const isCommentNonEmpty =
          row.comment !== null && row.comment !== undefined && row.comment.length !== 0;
      if (comment === "true" && !isCommentNonEmpty) return false;
      if (comment === "false" && isCommentNonEmpty) return false;
    }
    if (hasDyes && !dyes.includes(String(row.dyes))) return false;

    // 处理 needles 的匹配
    if (hasNeedles && !needles.includes(String(row.needles))) return false;

    // 如果通过所有条件，保留该行数据
    return true;
  });
});
const isDeleteDisabled = computed(() => {
  return selectedImagingIds.value.some((imagingId) => {
    const record = imagingRecords.value.find((img) => img.imaging_id === imagingId);
    return record && ["marked", "matched", "inserted"].includes(record.status);
  });
});

// 编辑对话框
const uploadDialogVisible = ref(false);
const editDialogVisible = ref(false)
const isExpanded = ['1'];
let editForm = ref({
  id: null,
  sampleId: '',
  tissueId: '',
  rollId: '',
  sliceId: '',
  blockId: '--',
  injected_num: 0,
  comment: '',
  dyes: 1,
  needles: 1,
  status: 'injected', // 默认状态为 injected
  perfusion_user: '',
  perfusion_date: '',
  dye_name:''
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
  Dyes: 1,
  Z_Size:0.0,
  Y_Size:0.0,
  X_Size:0.0,
  File_Size_GB:0.0,
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

const searchQuery = ref({
  sampleId: '',
  tissueId: '',
  rollId: '',
  sliceId: '',
  status: '',
  comment: '',
  dyes: [], // 默认检索 1, 2, 3, 4
  needles: [],
});

// 分页状态
const currentPage = ref(1); // 当前页码
const pageSize = ref(10); // 每页显示的记录数

// 初始化获取数据
onMounted(() => {
  fetchData();
});

// 从后端获取数据
async function fetchData() {
  try {
    const response = await axios.get('/api/sample_preparation');
    rawData.value = response.data;
    console.log('rawData',rawData);
  } catch (error) {
    console.error('Error fetching data:', error);
    ElMessage.error('Failed to fetch data.');
  }
}

// 计算分页后的数据
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredData.value.slice(start, end);
});

// 分页切换时的处理函数
function handlePageChange(page) {
  currentPage.value = page;
}

function search() {
  console.log(searchQuery.value);
  const statusArray = Array.isArray(searchQuery.value.status)
      ? [...searchQuery.value.status] // 用扩展运算符拷贝一份
      : [];
  filteredData.value = rawData.value.filter((row) => {
    const matchSampleId =
        !searchQuery.value.sampleId ||
        row.sampleId.includes(searchQuery.value.sampleId);

    const matchTissueId =
        !searchQuery.value.tissueId ||
        row.tissueId.includes(searchQuery.value.tissueId);

    const matchRollId =
        !searchQuery.value.rollId ||
        row.rollId.includes(searchQuery.value.rollId);

    const matchSliceId =
        !searchQuery.value.sliceId ||
        row.sliceId.includes(searchQuery.value.sliceId);

    const matchStatus =
        !searchQuery.value.status ||
        searchQuery.value.status.length === 0 ||
        statusArray.some((item) => row.status.includes(item));

    const matchComment =
        (searchQuery.value.comment === 'true' && String(row.comment).trim() !== "")


    return (
        matchSampleId &&
        matchTissueId &&
        matchRollId &&
        matchSliceId &&
        matchStatus &&
        matchComment
    );
  });
}

function resetSearch() {
  searchQuery.value = {
    sampleId: '',
    tissueId: '',
    rollId: '',
    sliceId: '',
    status: '',
    comment: '',
    dyes: [], // 默认检索 1, 2, 3, 4
    needles: [],
  };
  filteredData.value = rawData.value; // 重置为所有数据
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

  await axios.post('/api/upload_files', formData, {
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
    injected_num: 0,
    blockId: '--', // 默认值
    dyes: 0,
    needles: 0,
    status: 'injected',
    perfusion_user: '',
    perfusion_date: '',
    dye_name:''
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
  console.log('fileList',fileList.value[0])
  let fileName = fileList.value[0].name
  let regex = new RegExp(
        `${currentSampleId.value}\\.csv$`
  );
  if (!regex.test(fileName)) {
    ElMessage.error(
        `Invalid file name. Expected format: ${currentSampleId.value}.csv`
    );
    return;
  }
  // 检查文件是否已经存在
  const checkFileExistsResponse = await axios.get(`/api/check_sample_file_exists?filename=${file.name}`);
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

      try {
        const response = await axios.post('/api/upload_injection_file', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
            // Include authorization headers if required
            // 'Authorization': `Bearer ${token}`
          }
        });

        if (response.status === 200) {
          ElMessage.success(response.data.message || 'Injection file uploaded successfully.');
          return response; // Contains sample_preparation_id and other parameters
        } else {
          ElMessage.error(response.data.detail || 'Injection file upload failed.');
          return null;
        }
      } catch (error) {
        if (error.response && error.response.data && error.response.data.detail) {
          ElMessage.error(error.response.data.detail);
        } else if (error.message) {
          ElMessage.error(`Upload Error: ${error.message}`);
        } else {
          ElMessage.error('An unexpected error occurred during file upload.');
        }
        return null;
      }
    } catch (error) {
      // 用户选择“取消”，终止上传
      console.log('User canceled overwrite. Aborting upload.');
      uploadDialogVisible.value = false
      ElMessageBox.close()
      return null
    }
  }
  else {
    ElMessageBox.close()
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axios.post('/api/upload_injection_file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
          // Include authorization headers if required
          // 'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        ElMessage.success(response.data.message || 'Injection file uploaded successfully.');
        return response; // Contains sample_preparation_id and other parameters
      } else {
        ElMessage.error(response.data.detail || 'Injection file upload failed.');
        return null;
      }
    } catch (error) {
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
      return null;
    }
  }
}

// async function saveUploadedData() {
//   console.log(editForm.value)
//   if (!editForm.value.sampleId || !editForm.value.tissueId || !editForm.value.rollId || !editForm.value.sliceId) {
//     ElMessage.error('SampleID, TissueID, RollID, and SliceID are required.');
//     return;
//   }
//
//   const formData = new FormData();
//   formData.append('sampleId', editForm.value.sampleId);
//   formData.append('tissueId', editForm.value.tissueId);
//   formData.append('rollId', editForm.value.rollId);
//   formData.append('sliceId', editForm.value.sliceId);
//   formData.append('blockId', editForm.value.blockId);
//   formData.append('status', editForm.value.status);
//   currentSampleId.value = `${editForm.value.sampleId}-${editForm.value.tissueId}-${editForm.value.rollId}-${editForm.value.sliceId}`;
//   // 判断 Block ID 是否为 '--'，如果不是，则添加到末尾
//   if (editForm.value.blockId && editForm.value.blockId !== '--') {
//     currentSampleId.value += `-${editForm.value.blockId}`;
//   }
//   try {
//     const newSample = { ...editForm.value, imaging_records: [] }; // 新建时 imaging_records 为空
//     const response = await axios.post('/api/sample_preparation', newSample);
//
//     // 检查响应状态
//     if (response && response.status === 200) {
//       // 成功创建样本
//       rawData.value.push(response.data);
//       ElMessage.success('New sample added.');
//
//       // 上传 Injection 文件
//       let result = await uploadInjectionFile();
//       if (result === 'continue') {
//         ElMessage.success('Injection file uploaded to database successfully.');
//       } else {
//         ElMessage.error('Upload cancelled.');
//       }
//     } else if (response && response.status === 400) {
//       // 显示服务器返回的错误信息
//       if (response.data && response.data.detail) {
//         ElMessage.error(response.data.detail);
//       } else {
//         ElMessage.error('Bad Request: Invalid data.');
//       }
//     } else {
//       // 未知的错误状态
//       ElMessage.error(`Unexpected status code: ${response.status}`);
//     }
//   } catch (error) {
//     // 捕获网络错误或其他问题
//     if (error.response && error.response.data && error.response.data.detail) {
//       // 显示后端返回的错误信息
//       ElMessage.error(error.response.data.detail);
//     } else if (error.message) {
//       // 显示一般错误信息
//       ElMessage.error(`Error: ${error.message}`);
//     } else {
//       ElMessage.error('An unexpected error occurred. Please try again.');
//     }
//   }
// }
async function saveUploadedData() {
  console.log(editForm.value);

  // Step 1: Validate Required Fields
  const { sampleId, tissueId, rollId, sliceId, blockId, status } = editForm.value;
  if (!sampleId || !tissueId || !rollId || !sliceId) {
    ElMessage.error('SampleID, TissueID, RollID, and SliceID are required.');
    return;
  }

  // Step 2: Upload the Injection File First
  let uploadParams;
  try {
    const uploadResult = await uploadInjectionFile();
    console.log('uploadResult',uploadResult);
    // Assuming uploadInjectionFile returns an object with 'success' and 'data' properties
    if (uploadResult.status === 200) {
      ElMessage.success('Injection file uploaded successfully.');
      uploadParams = uploadResult.data; // Parameters returned from backend after file processing
    } else {
      ElMessage.error(uploadResult.message || 'Injection file upload failed.');
      return; // Halt the process if upload failed
    }
  } catch (error) {
    // Handle errors from uploadInjectionFile
    if (error.response && error.response.data && error.response.data.detail) {
      ElMessage.error(error.response.data.detail);
    } else if (error.message) {
      ElMessage.error(`Upload Error: ${error.message}`);
    } else {
      ElMessage.error('An unexpected error occurred during file upload.');
    }
    return; // Halt the process on error
  }

  // Step 3: Prepare Sample Record Data
  const newSample = {
    sampleId,
    tissueId,
    rollId,
    sliceId,
    blockId,
    status,
    ...uploadParams, // Include parameters from the file upload
    imaging_records: [] // Initialize imaging_records as empty
  };

  // Construct the currentSampleId
  currentSampleId.value = `${sampleId}-${tissueId}-${rollId}-${sliceId}`;
  if (blockId && blockId !== '--') {
    currentSampleId.value += `-${blockId}`;
  }

  // Step 4: Create the Sample Record
  try {
    const response = await axios.post('/api/sample_preparation', newSample);

    // Check response status
    if (response && response.status === 200) {
      // Successfully created the sample
      rawData.value.push(response.data);
      ElMessage.success('New sample added successfully.');
    } else if (response && response.status === 400) {
      // Handle Bad Request errors
      if (response.data && response.data.detail) {
        ElMessage.error(response.data.detail);
      } else {
        ElMessage.error('Bad Request: Invalid data.');
      }
    } else {
      // Handle unexpected status codes
      ElMessage.error(`Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    // Handle network errors or other issues during sample creation
    if (error.response && error.response.data && error.response.data.detail) {
      ElMessage.error(error.response.data.detail);
    } else if (error.message) {
      ElMessage.error(`Error: ${error.message}`);
    } else {
      ElMessage.error('An unexpected error occurred while creating the sample.');
    }
  }
}
// 取消上传
function cancelUpload() {
  uploadDialogVisible.value = false;
  resetForm();
}
function cancelUploadImage() {
  uploadImageDialogVisible.value = false;
  imagingFileList.value = [];
}

// 保存样本数据（新建或更新）
async function saveSampleData() {
  if (!editForm.value.sampleId) {
    ElMessage.warning('Patient ID is required.');
    return;
  }
    // PUT 到后端更新
  try {
    const updatedSample = {...editForm.value, imaging_records: editForm.value.imaging_records || []};
    const response = await axios.put(`/api/sample_preparation/${editForm.value.id}`, updatedSample);
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
  axios.get('/api/folders').then(response => {
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
  axios.get(`/api/download_folder?folder=${selectedFolder.value}`, {
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
function uploadInjection(row) {
  currentSampleId.value = `${row.sampleId}-${row.tissueId}-${row.rollId}-${row.sliceId}`;
  // 判断 Block ID 是否为 '--'，如果不是，则添加到末尾
  if (row.blockId && row.blockId !== '--') {
    currentSampleId.value += `-${row.blockId}`;
  }
  uploadInjectionFileVisible.value = true;
}

async function downloadInjection(row) {
  console.log('download injection',row);
  let bNumber = '';
  if (row.blockId !== "--") {
    bNumber = `-${row.blockId}`;
  }
  let sample_preparation_id = `${row.sampleId}-${row.tissueId}-${row.rollId}-${row.sliceId}${bNumber}`;
  try {
    // 使用 Axios 请求文件
    const response = await axios.get(`/api/get_injection_file/${sample_preparation_id}`, {
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
  console.log('current Patient ID', currentSampleId.value);
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
    await axios.put(`/api/imaging_records/${record.sample_preparation_id}/${imagingId}`, record);

    // 检查是否需要更新 Sample 的状态
    await checkAndUpdateSampleStatus(record.sample_preparation_id);

    // ElMessage.success(`Imaging record ${imagingId} updated to ${newStatus}.`);
  } catch (error) {
    console.log(`Failed to update imaging record ${imagingId} to ${newStatus}.`);
  }
}

// async function checkAndUpdateSampleStatus(sampleId) {
//   try {
//     const sample = rawData.value.find((s) => s.id === sampleId);
//     if (!sample) {
//       ElMessage.error("Sample not found.");
//       return;
//     }
//
//     const allStatuses = sample.imaging_records.map((record) => record.status);
//
//     // 按状态检测顺序：imaged -> marked -> inserted -> matched
//     const orderedStatuses = ["imaged", "marked", "inserted", "matched"];
//     for (const status of orderedStatuses) {
//       if (allStatuses.every((recStatus) => recStatus === status)) {
//         // 更新样本状态为当前状态
//         sample.status = status;
//
//         // 后端同步状态
//         await axios.put(`/api/sample_preparation/${sampleId}`,sample);
//
//         // ElMessage.success(`Sample ${sampleId} updated to ${status}.`);
//         return;
//       }
//     }
//   } catch (error) {
//     console.log(`Failed to update sample ${sampleId} status.`);
//   }
// }
async function checkAndUpdateSampleStatus(sampleId) {
  try {
    const sample = rawData.value.find((s) => s.id === sampleId);
    if (!sample) {
      ElMessage.error("Sample not found.");
      return;
    }

    // 拿到所有 imaging_records 的状态
    const allStatuses = sample.imaging_records.map((record) => record.status);

    // 定义状态顺序：索引越小表示越慢 / 越早期
    const orderedStatuses = ["imaged", "marked", "inserted", "matched"];

    // 一个小工具函数：返回该状态在 orderedStatuses 里的索引
    // 找不到就给一个很大的数字，以便识别出是无效状态
    // eslint-disable-next-line no-inner-declarations
    function getPriority(st) {
      const idx = orderedStatuses.indexOf(st);
      return idx === -1 ? 999 : idx;
    }

    // 在所有 imaging_records 的状态里，选出“最慢”的那个（即索引最小）
    // reduce 每次比较优先级，保留优先级更小（更慢）的状态。
    const lowestStatus = allStatuses.reduce((lowest, current) => {
      return getPriority(current) < getPriority(lowest) ? current : lowest;
    }, allStatuses[0]);

    // 更新 sample 的状态为 lowestStatus
    sample.status = lowestStatus;

    // 调用后端接口更新数据库
    await axios.put(`/api/sample_preparation/${sampleId}`, sample);

    // 提示成功，可根据实际需要是否保留
    ElMessage.success(`Sample ${sampleId} updated to ${lowestStatus}.`);

  } catch (error) {
    console.log(`Failed to update sample ${sampleId} status.`, error);
  }
}

// 打开 imaging dialog
function openImagingDialog(row) {
  currentSampleId.value = `${row.sampleId}-${row.tissueId}-${row.rollId}-${row.sliceId}`;
  // 判断 Block ID 是否为 '--'，如果不是，则添加到末尾
  if (row.blockId && row.blockId !== '--') {
    currentSampleId.value += `-${row.blockId}`;
  }
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
  console.log('current Patient ID',currentSampleId.value)
  if (!fileName.startsWith(samplePrefix)) {
    console.error('File name does not match the current Patient ID!');
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
  axios.post(`/api/upload_imaging_metadata/${currentSampleId.value}/${imagingBlockForm.value.imaging_id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
      .then(response => {
        // Handle success
        ElMessage.success('imaging metadata uploaded successfully');
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
      });
}

async function uploadImagingMetadataFiles() {
  if (!metadataFilesList.value || metadataFilesList.value.length === 0) {
    ElMessage.error('No files selected for upload.');
    return;
  }

  const file = metadataFilesList.value[0];
  const fileName = file.name;

  // 验证文件名格式
  let regex = ''
  if(imagingBlockForm.value.imaging_id === '--'){
    regex = new RegExp(
        `^${currentSampleId.value}-${imagingBlockForm.value.producer}\\.(xlsx|xml)$`
    );
  }else {
    regex = new RegExp(
        `^${currentSampleId.value}-${imagingBlockForm.value.imaging_id}-${imagingBlockForm.value.producer}\\.(xlsx|xml)$`
    );
  }
  if (!regex.test(fileName)) {
    ElMessage.error(
        `Invalid file name. Expected format: {sample_preparation}-{imaging_id}-{name}.xlsx or .xml`
    );
    return;
  }

  try {
    // 检查文件是否已存在
    const checkResponse = await axios.get(
        `/api/check_imaging_record_file_exists/${currentSampleId.value}/${imagingBlockForm.value.imaging_id}`,
        {
          params: {
            filename: fileName,
          },
        }
    );

    if (checkResponse.status === 200 && checkResponse.data.exists) {
      // 如果文件已存在，提示用户是否覆盖
      const confirmOverwrite = await ElMessageBox.confirm(
          `The file '${fileName}' already exists. Do you want to replace it?`,
          'Confirmation',
          {
            confirmButtonText: 'Yes',
            cancelButtonText: 'No',
            type: 'warning',
          }
      );

      if (confirmOverwrite !== 'confirm') {
        ElMessage.info('Operation cancelled by the user.');
        return;
      }
    }

    // 上传文件（覆盖模式）
    const formData = new FormData();
    formData.append('metadata_file', file.raw);
    const uploadResponse = await axios.post(
        `/api/upload_imaging_metadata/${currentSampleId.value}/${imagingBlockForm.value.imaging_id}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
    );

    if (uploadResponse.status === 200) {
      ElMessage.success('File uploaded successfully.');
      const uploadedFiles = uploadResponse.data.uploaded_files || [];
      // 从文件列表中移除已上传的文件
      metadataFilesList.value = metadataFilesList.value.filter(
          (file) => !uploadedFiles.includes(file.name)
      );
    } else {
      ElMessage.error('File upload failed.');
    }
  } catch (error) {
    console.error('Error during file upload:', error);
    if (error.response && error.response.data && error.response.data.detail) {
      ElMessage.error(error.response.data.detail);
    } else {
      ElMessage.error('An error occurred during file upload.');
    }
  }
}

// async function uploadImagingMarkerFiles() {
//   const formData = new FormData();
//   formData.append('marker_file', markerFilesList.value[0].raw);
//   console.log('formData',formData)
//   axios.post('/api/upload_imaging_marker', formData, {
//     headers: { 'Content-Type': 'multipart/form-data' }
//   })
//       .then(response => {
//         // Handle success
//         ElMessage.success('File uploaded successfully');
//         const uploadedFiles = response.data.uploaded_files || [];
//         // Remove uploaded files from the file list
//         markerFilesList.value = markerFilesList.value.filter(file => !uploadedFiles.includes(file.name));
//         updateImagingRecordStatus(imagingBlockForm.value.imaging_id, "marked");
//       })
//       .catch(error => {
//         let errorMessage = 'Files upload failed';
//         if (error.response && error.response.data.detail) {
//           if (typeof error.response.data.detail === 'string') {
//             errorMessage = error.response.data.detail;
//           } else if (typeof error.response.data.detail === 'object') {
//             errorMessage = error.response.data.detail.error || 'Files upload failed';
//           }
//         }
//         ElMessage.error(errorMessage);
//       });
// }

async function uploadImagingMatchTableFiles() {
  try {
    // 检查文件名是否符合规则
    const file = matchTableFilesList.value[0];
    let fileNamePattern = ''
    if(imagingBlockForm.value.imaging_id === '--'){
      fileNamePattern = new RegExp(
          `^${currentSampleId.value}(-[A-Za-z_]{2,10})?-matched\\.csv$`
      );
    }else {
      fileNamePattern = new RegExp(
          `^${currentSampleId.value}-${imagingBlockForm.value.imaging_id}(-[A-Za-z_]{2,10})?-matched\\.csv$`
      );
    }



    if (!fileNamePattern.test(file.name)) {
      ElMessage.error(
          `Invalid filename format. Expected format: ${currentSampleId.value}-${imagingBlockForm.value.imaging_id}(-NAME)-matched.csv`
      );
      return;
    }

    // 检查文件是否已经存在
    const checkResponse = await axios.get(
        `/api/check_imaging_record_file_exists/${currentSampleId.value}/${imagingBlockForm.value.imaging_id}`,
        {
          params: { filename: file.name },
        }
    );

    if (checkResponse.status === 200 && checkResponse.data.exists) {
      // 提示用户是否覆盖
      const confirmOverwrite = await ElMessageBox.confirm(
          `A file with the name '${file.name}' already exists. Do you want to overwrite it?`,
          'File Exists',
          {
            confirmButtonText: 'Yes, Overwrite',
            cancelButtonText: 'No, Cancel',
            type: 'warning',
          }
      );

      if (confirmOverwrite !== 'confirm') {
        // 用户选择不覆盖，直接返回
        ElMessage.info('File upload cancelled.');
        return;
      }
    }

    // 上传文件
    const formData = new FormData();
    formData.append('matchtable_file', file.raw);

    const response = await axios.post(
        `/api/upload_imaging_match_table/${currentSampleId.value}/${imagingBlockForm.value.imaging_id}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
    );

    if (response && response.status === 200) {
      ElMessage.success('File uploaded successfully');
      const uploadedFiles = response.data.uploaded_files || [];
      // 移除已上传文件
      matchTableFilesList.value = matchTableFilesList.value.filter(
          (file) => !uploadedFiles.includes(file.name)
      );

      // 更新记录状态为 "matched"
      await updateImagingRecordStatus(imagingBlockForm.value.imaging_id, 'matched');
      await checkAndUpdateSampleStatus(currentSampleIndex.value)
    } else {
      ElMessage.error('Failed to upload file.');
    }
  } catch (error) {
    console.error('Error uploading imaging match table file:', error);
    if (error.response && error.response.data.detail) {
      ElMessage.error(error.response.data.detail);
    } else if (error.message) {
      ElMessage.error(error.message);
    } else {
      ElMessage.error('Failed to upload file. Please try again.');
    }
  }
}
async function uploadImagingAnnotationFiles() {
  try {
    // 检查文件名是否符合规则
    const file = markerFilesList.value[0];
    let fileNamePattern = ''
    if(imagingBlockForm.value.imaging_id === '--'){
      fileNamePattern = new RegExp(
          `^${currentSampleId.value}(-[A-Za-z_]{2,10})?\\.apo$`
      );
    }else {
      fileNamePattern = new RegExp(
          `^${currentSampleId.value}-${imagingBlockForm.value.imaging_id}(-[A-Za-z_]{2,10})?\\.apo$`
      );
    }



    if (!fileNamePattern.test(file.name)) {
      ElMessage.error(
          `Invalid filename format. Expected format: ${currentSampleId.value}-${imagingBlockForm.value.imaging_id}(-NAME).apo`
      );
      return;
    }

    // 检查文件是否已经存在
    const checkResponse = await axios.get(
        `/api/check_imaging_record_file_exists/${currentSampleId.value}/${imagingBlockForm.value.imaging_id}`,
        {
          params: { filename: file.name },
        }
    );

    if (checkResponse.status === 200 && checkResponse.data.exists) {
      // 提示用户是否覆盖
      const confirmOverwrite = await ElMessageBox.confirm(
          `A file with the name '${file.name}' already exists. Do you want to overwrite it?`,
          'File Exists',
          {
            confirmButtonText: 'Yes, Overwrite',
            cancelButtonText: 'No, Cancel',
            type: 'warning',
          }
      );

      if (confirmOverwrite !== 'confirm') {
        // 用户选择不覆盖，直接返回
        ElMessage.info('File upload cancelled.');
        return;
      }
    }

    // 上传文件
    const formData = new FormData();
    formData.append('annotation_file', file.raw);

    const response = await axios.post(
        `/api/upload_imaging_annotation_file/${currentSampleId.value}/${imagingBlockForm.value.imaging_id}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
    );

    if (response && response.status === 200) {
      ElMessage.success('File uploaded successfully');
      const uploadedFiles = response.data.uploaded_files || [];
      // 移除已上传文件
      markerFilesList.value = markerFilesList.value.filter(
          (file) => !uploadedFiles.includes(file.name)
      );

      // 更新记录状态为 "matched"
      await updateImagingRecordStatus(imagingBlockForm.value.imaging_id, 'marked');
      await checkAndUpdateSampleStatus(currentSampleIndex.value)
    } else {
      ElMessage.error('Failed to upload file.');
    }
  } catch (error) {
    console.error('Error uploading imaging annotation file:', error);
    if (error.response && error.response.data.detail) {
      ElMessage.error(error.response.data.detail);
    } else if (error.message) {
      ElMessage.error(error.message);
    } else {
      ElMessage.error('Failed to upload file. Please try again.');
    }
  }
}

// 新建 Imaging Record
async function newImagingRecord() {
  if (imagingFileList.value.length === 0) {
    ElMessage.error('Please select a CSV file.');
    return;
  }
  let fileName = imagingFileList.value[0].name
  let regex = new RegExp(
      `^${currentSampleId.value}(-\\d+)?-[A-Za-z_]{2,10}\\.(xlsx|xml)$`
  );
  console.log('Current Patient ID:', currentSampleId.value);
  console.log('Uploaded File Name:', fileName);
  if (!regex.test(fileName)) {
    ElMessage.error(
        `Invalid file name. Expected format: ${currentSampleId.value}(-N)(-Name).(xlsx/xml)`
    );
    return;
  }

  try {
    // 如果没有重复文件或用户确认覆盖，继续创建新记录
    const newRecord = {
      imaging_id: imagingBlockForm.value.imaging_id, // Imaging ID
      sample_preparation_id: currentSampleIndex.value, // 父表 SamplePreparation 的 ID
      producer: imagingBlockForm.value.producer,
      status: imagingBlockForm.value.status,
    };

    // 发送 POST 请求创建新记录
    const response = await axios.post('/api/imaging_records', newRecord);

    if (response && response.status === 200) {
      const createdRecord = response.data;

      // 本地更新 imagingRecords
      imagingRecords.value = [...imagingRecords.value, createdRecord];

// 同时更新 rawData 中对应样本的 imaging_records
      const sampleIndex = rawData.value.findIndex(sample => sample.id === currentSampleIndex.value);
      if (sampleIndex !== -1) {
        // 强制替换整个 imaging_records 数组，确保 Vue 响应式更新
        rawData.value[sampleIndex].imaging_records = [
          ...rawData.value[sampleIndex].imaging_records,
          createdRecord
        ];
      }

      ElMessage.success('New imaging record added.');
      await checkAndUpdateSampleStatus(currentSampleIndex.value);

      // 上传文件
      await uploadImagingInfoFiles();

      uploadImageDialogVisible.value = false;
    } else {
      // 处理非 200 状态码
      if (response.data && response.data.detail) {
        ElMessage.error(response.data.detail);
      } else {
        ElMessage.error('Failed to create imaging record. Unexpected response from server.');
      }
    }
  } catch (error) {
    // 捕获异常并显示错误信息
    console.error('Error creating imaging record:', error);

    if (error.response && error.response.data && error.response.data.detail) {
      ElMessage.error(error.response.data.detail);
    } else if (error.message) {
      ElMessage.error(error.message);
    } else {
      ElMessage.error('Failed to create imaging record. Please try again.');
    }
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
      await axios.delete(`/api/imaging_records/${record.sample_preparation_id}/${record.imaging_id}`);
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
    await checkAndUpdateSampleStatus(currentSampleIndex.value);
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
    const response = await axios.put(`/api/sample_preparation/${currentSampleId.value}`, updatedSample);
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
    selectedImagingIds.value = imagingRecords.value.map(r => r.imaging_id);
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
// async function saveImagingBlock() {
//   try {
//     const updatedRecord = {
//       imaging_id: imagingBlockForm.value.imaging_id,
//       sample_preparation_id: imagingBlockForm.value.sample_preparation_id,
//       producer: imagingBlockForm.value.producer,
//       status: imagingBlockForm.value.status,
//     };
//     console.log(imagingBlockForm.value);
//     // 发送 PUT 请求更新记录
//     const response = await axios.put(`/api/imaging_records/${imagingBlockForm.value.sample_preparation_id}/${imagingBlockForm.value.imaging_id}`, updatedRecord);
//
//     // 更新本地表格数据
//     const index = imagingRecords.value.findIndex(record => record.imaging_id === imagingBlockForm.value.imaging_id);
//     if (index > -1) {
//       imagingRecords.value.splice(index, 1, response.data);
//       ElMessage.success('Imaging record updated.');
//     }
//     editImageDialogVisible.value = false;
//   } catch (error) {
//     console.error('Error saving imaging block:', error);
//     ElMessage.error('Failed to update imaging record.');
//   }
// }


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

async function downloadImagingFiles(img) {
  try {
    // 调用后端 axios，下载压缩包
    const response = await axios.get(
        `/api/download_imaging_records_files/${currentSampleId.value}/${img.imaging_id}`,
        {
          responseType: "blob", // 确保文件流可以正确下载
        }
    );

    // 创建 Blob 对象
    const blob = new Blob([response.data], {type: "application/zip"});

    // 生成下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentSampleId.value}_${img.imaging_id}_files.zip`;
    link.click();

    // 释放 URL 对象
    window.URL.revokeObjectURL(url);

    // 提示成功消息
    ElMessage.success("File downloaded successfully.");
  } catch (error) {
    console.error("Error downloading imaging files:", error);

    if (error.response && error.response.status === 404) {
      ElMessage.error("No files found for the selected imaging record.");
    } else {
      ElMessage.error("Failed to download files. Please try again.");
    }
  }
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
function handleBrightFieldDataChange(file,fileList) {
  brightFieldDataFilesList.value = fileList;
}
function handleBrightFieldDataRemove() {
  brightFieldDataFilesList.value = [];
}

function uploadImagingMapFiles() {
  const formData = new FormData();
  formData.append('imaging_map_file', imagingMapFilesList.value[0].raw);
  axios.post('/api/upload_imaging_map', formData, {
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
    const response = await axios.get(`/api/get_imaging_map/${currentSampleId.value}`, {
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
    const response = await axios.get(`/api/get_imaging_mip/${currentSampleId.value}/${imaging_id}`, {
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

  try {
    // 检查文件是否已经存在
    const checkResponse = await axios.get(`/api/check_imaging_record_file_exists/${currentSampleId.value}/${imagingBlockForm.value.imaging_id}`, {
      params: {
        filename: imagingDataFilesList.value[0].name,
      },
    });

    if (checkResponse.data.exists) {
      // 如果文件存在，提示用户是否覆盖
      const confirmOverwrite = await ElMessageBox.confirm(
          `A file with the name '${imagingDataFilesList.value[0].name}' already exists. Do you want to overwrite it?`,
          'Confirmation',
          {
            confirmButtonText: 'Yes',
            cancelButtonText: 'No',
            type: 'warning',
          }
      );

      if (confirmOverwrite !== 'confirm') {
        // 如果用户选择不覆盖，直接返回
        ElMessage.info('File upload cancelled.');
        return;
      }
    }

    // 如果文件不存在，或者用户选择覆盖，继续上传
    const response = await axios.post(`/api/upload_imaging_data/${currentSampleId.value}/${imagingBlockForm.value.imaging_id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    // 上传成功后的处理逻辑
    if (response && response.status === 200) {
      ElMessage.success('File uploaded successfully.');
      imagingDataFilesList.value = []
    } else {
      // 非200状态码的处理
      ElMessage.error('Failed to upload the file. Unexpected response.');
    }
  } catch (error) {
    // 异常处理逻辑
    console.error('Error uploading imaging data file:', error);
    if (error.response && error.response.data && error.response.data.detail) {
      ElMessage.error(error.response.data.detail);
    } else {
      ElMessage.error('Failed to upload the file. Please try again.');
    }
  }
}

// async function uploadBrightFieldDataFiles() {
//   if (brightFieldDataFilesList.value.length === 0) {
//     ElMessage.error('No files selected for upload.');
//     return;
//   }
//
//   const formData = new FormData();
//   for (const item of brightFieldDataFilesList.value) {
//     // 普通文件
//     formData.append('bright_field_data_files', item.raw, item.name);
//   }
//
//   await axios.post(`/api/upload_bright_field_data/${currentSampleId.value}`, formData, {
//     headers: { 'Content-Type': 'multipart/form-data' }
//   })
//       .then(response => {
//         // Handle success
//         ElMessage.success('File uploaded successfully');
//         const uploadedFiles = response.data.uploaded_files || [];
//         // Remove uploaded files from the file list
//         brightFieldDataFilesList.value = brightFieldDataFilesList.value.filter(file => !uploadedFiles.includes(file.name));
//       })
//       .catch(error => {
//         // let error = 'Files upload failed';
//         if (error.response && error.response.data.detail) {
//           if (typeof error.response.data.detail === 'string') {
//             // errorMessage = error.response.data.detail;
//           } else if (typeof error.response.data.detail === 'object') {
//             // errorMessage = error.response.data.detail.error || 'Files upload failed';
//           }
//         }
//         // ElMessage.error(errorMessage);
//       });
//
// }
async function uploadBrightFieldDataFiles() {
  if (brightFieldDataFilesList.value.length === 0) {
    ElMessage.error('No files selected for upload.');
    return;
  }

  try {
    // 获取灌注表中的 Id 列
    const response = await axios.get(`/api/get_injection_ids/${currentSampleId.value}`);
    const idList = response.data;

    // 验证上传文件名是否符合 Id 列中的值
    for (const file of brightFieldDataFilesList.value) {
      const fileNameWithoutPrefix = file.name.replace(/^BF_/, '').replace('.tif', '');
      if (!idList.includes(fileNameWithoutPrefix)) {
        ElMessage.error(`Invalid file name: ${file.name}. Expected one of: ${idList.join(', ')}`);
        return;
      }
    }

    // 构造表单数据并上传文件
    const formData = new FormData();
    for (const item of brightFieldDataFilesList.value) {
      formData.append('bright_field_data_files', item.raw, item.name);
    }

    const uploadResponse = await axios.post(`/api/upload_bright_field_data/${currentSampleId.value}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (uploadResponse.status === 200) {
      ElMessage.success('File uploaded successfully');
      brightFieldDataFilesList.value = []
    }
  } catch (error) {
    console.error('Error uploading bright field data files:', error);
    ElMessage.error('Failed to upload bright field data files.');
  }
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
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>