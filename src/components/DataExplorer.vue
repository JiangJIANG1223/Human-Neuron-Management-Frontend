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
          <img v-if="imageUrl" :src="imageUrl" alt="Image" class="image-preview" @load="adjustImageSize">
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
      selectedData: [],
      currentIndex: 0,
      imageUrl: '' // 用于存储当前图像的 URL
    };
  },
  computed: {
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
    }
  },
  methods: {
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
    prevItem() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.fetchImageUrl(this.currentItem.image_file); // 加载当前项的图像
      }
    },
    nextItem() {
      if (this.currentIndex < this.selectedData.length - 1) {
        this.currentIndex++;
        this.fetchImageUrl(this.currentItem.image_file); // 加载当前项的图像
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
  margin: 10px 0;
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
</style>

