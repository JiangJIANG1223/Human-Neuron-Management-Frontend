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
          <img v-if="currentItem.image_file" :src="getImageUrl(currentItem.image_file)" alt="Image" class="image-preview">
          <div v-for="(value, key) in filteredAttributes" :key="key" class="attribute">
            <strong>{{ key }}:</strong> {{ value }}
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'DataExplorer',
  data() {
    return {
      selectedData: [],
      currentIndex: 0
    };
  },
  computed: {
    currentItem() {
      return this.selectedData[this.currentIndex] || {};
    },
    filteredAttributes() {
      const attributesToShow = ['cell_id', 'sample_number', 'tissue_block_number', 'slice_number', 'fresh_perfusion', 'brain_region', 'slice_thickness', 'cell_depth', 'inject_method'];
      return attributesToShow.reduce((result, key) => {
        if (this.currentItem[key] !== undefined) {
          result[key] = this.currentItem[key];
        }
        return result;
      }, {});
    }
  },
  created() {
    this.fetchSelectedData();
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
    getImageUrl(imagePath) {
      return `http://10.192.34.220:8000/image/${imagePath}`;
    },
    prevItem() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
      }
    },
    nextItem() {
      if (this.currentIndex < this.selectedData.length - 1) {
        this.currentIndex++;
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
  max-width: 50%; /* 设置图像最大宽度 */
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

