<template>
  <div>
    <el-card>
      <h3>数据探索</h3>
      <div v-if="selectedData.length === 0">没有选中的数据</div>
      <div v-else>
        <div class="navigation">
          <el-button @click="prevItem" :disabled="currentIndex === 0">← 上一个</el-button>
          <el-button @click="nextItem" :disabled="currentIndex === selectedData.length - 1">下一个 →</el-button>
        </div>
        <div class="data-item">
          <h4>{{ currentItem.cell_id }}</h4>

        <div style="display: flex; justify-content: center;">
            <div style="display: flex; align-items: center; justify-content: center;">
                <div style="display: flex; flex-direction: column; align-items: center; margin: -15px;">
                    <img v-show="imageUrl" :src="imageUrl" alt="Image" class="image-preview"
                         style="width: 77%;" @load="adjustImageSize">
                    <div class="image-label">MIP</div>
                </div>

                <!-- 下拉框代码 -->
                <select v-model="selectedVersion" @change="updateSwcUrl" class="custom-select" style="position: absolute; bottom: -5px; right: 5px;">
                    <option value="v0">Auto_1.4</option>
                    <option value="v1">其它版本未上线1</option>
                    <option value="v2">其它版本未上线2</option>
                </select>

                <div style="display: flex; flex-direction: column; align-items: center; margin: -5px;">
                    <img v-show="currentImage === 'both'" :src="mip_swc_url" alt="Both Image"
                         style="width: 77%;" @load="adjustImageSize">
                    <img v-show="currentImage === 'swc'" :src="swcUrl" alt="SWC Image"
                         style="width: 77%;" @load="adjustImageSize">
                    <div class="image-label">{{ currentImageLabel }}</div>
                </div>

                <el-button type="primary" @click="toggleImage" style="position: absolute; bottom: 40px; right: 5px;">{{ buttonLabel }}</el-button>
            </div>
        </div>

          <div v-for="(value, key) in filteredAttributes" :key="key" class="attribute">
            <strong>{{ key }}:</strong> {{ value }}
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import axios from '@/axios'; // 导入配置的 axios 实例

export default {
  name: 'DataExplorer',
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
      selectedData: [],
      currentIndex: 0,
      imageUrl: '', // 用于存储当前图像的 URL
      swcUrl:'',// 存储SWC图像的url
      mip_swc_url:''
    };
  },
  computed: {
    buttonLabel() {
            return this.currentImage === 'both' ? 'View SWC' : 'View Both';
    },
    currentImageLabel() {
            return this.currentImage === 'both' ? 'Both' : 'SWC';
    },
    currentItem() {
      return this.selectedData[this.currentIndex] || {};
    },
    filteredAttributes() {
      // const attributesToShow = ['cell_id', 'sample_number', 'tissue_block_number', 'slice_number', 'fresh_perfusion', 'brain_region', 'slice_thickness', 'cell_depth', 'inject_method'];
      const attributesToShow = {
        'cell_id': 'Cell ID',
        'sample_number': 'Sample ID',
        'tissue_block_number': 'Tissue ID',
        'slice_number': 'Slice ID',
        'fresh_perfusion': 'Fresh Perfusion(0:No;1:Yes)',
        'brain_region': 'Brain Region',
        'slice_thickness': 'Slice Thinkness(μm)',
        'cell_depth': 'Cell Depth(μm)',
        'inject_method': 'Injection (0:Manual;1:Auto)'
      };
      return Object.keys(attributesToShow).reduce((result, key) => {
      if (this.currentItem[key] !== undefined) {
        result[attributesToShow[key]] = this.currentItem[key];
      }
      return result;
    }, {});
    }
  },
  created() {
    this.fetchSelectedData();
    if (this.selectedData.length > 0) {
      this.fetchImageUrl(this.selectedData[0].image_file); // 加载第一个图像
      this.fetchImageUrl1(this.selectedData[0].swc_auto14);
      this.fetchImageUrl2(this.selectedData[0].image_file, this.selectedData[0].swc_auto14); // 使用默认的 SWC URL,swcUrl是最终用到的展示路径
    }
  },
  methods: {
     toggleImage() {
              this.currentImage = this.currentImage === 'both' ? 'swc' : 'both';
     },
    updateSwcUrl() {
        if (this.selectedVersion === 'v0')
        {
          if(this.currentItem.swc_auto14)
              {this.fetchImageUrl1(this.currentItem.swc_auto14);
               this.fetchImageUrl2(this.currentItem.image_file, this.currentItem.swc_auto14);} // 使用默认的 SWC URL,swcUrl是最终用到的展示路径
          else
              {this.swcUrl = '';
               this.mip_swc_url = '';}
        }
        else if (this.selectedVersion === 'v1')
        {
          if(this.currentItem.swc_v1)
               {this.fetchImageUrl1(this.currentItem.swc_v1);
               this.fetchImageUrl2(this.currentItem.image_file, this.currentItem.swc_v1);} // 使用默认的 SWC URL,swcUrl是最终用到的展示路径
          else
              {this.swcUrl='';
               this.mip_swc_url = '';}

        }
         else if (this.selectedVersion === 'v2')
        {
          if(this.currentItem.swc_v2)
              {this.fetchImageUrl1(this.currentItem.swc_v2);
               this.fetchImageUrl2(this.currentItem.image_file, this.currentItem.swc_v2);} // 使用默认的 SWC URL,swcUrl是最终用到的展示路径
          else
              {this.swcUrl='';
               this.mip_swc_url = '';}
        }
    },
    fetchSelectedData() {
      const selectedData = this.$route.query.selectedData;
      if (selectedData) {
        this.selectedData = JSON.parse(selectedData);
      } else {
        this.selectedData = [];
      }
    },
    async fetchImageUrl(imagePath) {
      try {
        const response = await axios.get(`/api/image/${imagePath}`, { responseType: 'blob' });
        const imageUrl = URL.createObjectURL(response.data);
        this.imageUrl = imageUrl;
      } catch (error) {
        console.error('Error fetching image:', error);
        this.$message.error('获取图像失败');
        this.imageUrl = '';
      }
    },
    async fetchImageUrl1(ss) {
      if(!ss){
          this.$message.error('No SWC file');
          this.swcUrl = '';
          return '';

      }
      try {
       const response = await axios.post('/api/getSWC/', {
                    ss:ss  // 将文件夹路径发送到后端
                  }, {
                     responseType: 'blob' // 这里设置为 blob
                   });
        const swcUrl = URL.createObjectURL(response.data);
        this.swcUrl = swcUrl;
      } catch (error) {
        console.error('Error fetching image:', error);
        this.$message.error('获取图像失败');
        this.swcUrl = '';
      }
    },
    async fetchImageUrl2(imageFile, swcFile) { //获取MIP和SWC图像叠加图的
      if(!imageFile || !swcFile)
      {
            this.mip_swc_url= '';
            return '';
      }
      try {
        const response = await axios.post('/api/getMIPSWC/', {
          image_file: imageFile,  // 将image_file发送到后端
          swc_file: swcFile       // 将swc_file发送到后端
        }, {
          responseType: 'blob' // 这里设置为 blob
        });

        const mip_swc_url = URL.createObjectURL(response.data);
        this.mip_swc_url=mip_swc_url;  // 返回生成的URL
      } catch (error) {
        console.error('Error fetching combined image:', error);
        this.$message.error('获取图像失败');
        this.mip_swc_url= '';
      }
    },
    prevItem() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.selectedVersion='v0';
        this.currentImage = 'both';
        this.fetchImageUrl(this.currentItem.image_file); // 加载当前项的图像
        this.fetchImageUrl1(this.currentItem.swc_auto14);
        this.fetchImageUrl2(this.currentItem.image_file, this.currentItem.swc_auto14); // 使用默认的 SWC URL,swcUrl是最终用到的展示路径

      }
    },
    nextItem() {
      if (this.currentIndex < this.selectedData.length - 1) {
        this.currentIndex++;
        this.selectedVersion='v0';
        this.currentImage = 'both';
        this.fetchImageUrl(this.currentItem.image_file); // 加载当前项的图像
        this.fetchImageUrl1(this.currentItem.swc_auto14);
        this.fetchImageUrl2(this.currentItem.image_file, this.currentItem.swc_auto14); // 使用默认的 SWC URL,swcUrl是最终用到的展示路径

      }
    }
  }
};
</script>

<style scoped>
.data-item {
  margin-bottom: 20px;
  border-bottom: 1px solid #e8e8e8;
  padding-bottom: 20px;
  text-align: center; /* 中心对齐 */
}

.data-item h4 {
  margin: 0 0 10px 0;
}

.data-item img {
  margin: 20px 0;
  display: block;
  margin-left: auto;
  margin-right: auto;
  max-width: 100%; /* 确保图像不超过其容器的宽度 */
  height: auto; /* 保持图像的纵横比 */
}

.data-item .attribute {
  display: flex;
  justify-content: center;
  margin: 5px 0;
}

.navigation {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
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
/* 多版本SWC下拉框style设置结束*/
</style>

