<template>
  <div class="data-status-container">
    <div class="top-section">
      <div class="left-section">
        <div class="stats-boxes">
          <el-card class="stat-box" v-for="(item, index) in stats" :key="index">
            <div class="stat-title">{{ item.title }}</div>
            <div class="stat-value">
              <template v-if="index === 0">
                {{ item.value.total }} / {{ item.value.valid }}
              </template>
              <template v-else>
                {{ item.value }}
              </template>
            </div>
            <!-- <div class="stat-title">{{ item.title }}</div>
            <div class="stat-value">{{ item.value }}</div> -->
          </el-card>
        </div>
        <div class="trend-chart">
          <el-card>
            <h3>生产趋势</h3>
            <el-date-picker 
              v-model="dateRange" 
              type="daterange" 
              range-separator="至" 
              start-placeholder="开始日期" 
              end-placeholder="结束日期" 
              @change="fetchTrendData" 
              :picker-options="datePickerOptions">
            </el-date-picker>
            <div ref="chartContainer" style="width: 100%; height: 600px;"></div>
          </el-card>
        </div>
      </div>
      <div class="right-section">
        <h3>日报</h3>
        <el-input 
          type="textarea" 
          v-model="dailyReport" 
          :readonly="!isEditing" 
          placeholder="最新日报内容" 
          rows = '35'
          style="height: 780px;">
        </el-input>
        <div v-if="!isEditing">
          <el-button type="primary" @click="startEditing">上传日报</el-button>
        </div>
        <div v-else>
          <el-button type="primary" @click="saveReport">保存</el-button>
          <el-button @click="cancelEditing">取消</el-button>
        </div>
      </div>
    </div>

    <div class="bottom-section">
      <div class="additional-charts">
        <el-card>
          <h3>患者年龄分布</h3>
          <div ref="ageChartContainer" style="width: 100%; height: 400px;"></div>
        </el-card>
        <el-card>
          <h3>脑区分布(前十)</h3>
          <div ref="brainRegionChartContainer" style="width: 100%; height: 400px;"></div>
        </el-card>
        <el-card>
          <h3>免疫组化情况</h3>
          <div ref="ihcChartContainer" style="width: 100%; height: 400px;"></div>
        </el-card>
      </div>
    </div>
  </div>
</template>


<script>
import axios from '@/axios';
import * as echarts from 'echarts';
import { ElMessage } from 'element-plus';

export default {
  name: 'DataStatus',
  data() {
    return {
      stats: [
        { title: '样本 / 有效样本', value: { total: 0, valid: 0 }  },
        { title: '细胞', value: 0 },
        { title: '脑区', value: 0 },
      ],
      dateRange: [],
      dailyReport: '',
      latestReport: '',  // 新增
      isEditing: false, // 新增
      chart: null,
      ageChart: null,
      brainRegionChart: null,
      ihcChart: null,
      minDate: '',
      maxDate: '',
      datePickerOptions: {
        disabledDate: (time) => {
          const minDate = new Date(this.minDate);
          const maxDate = new Date(this.maxDate);
          return time.getTime() < minDate.getTime() || time.getTime() > maxDate.getTime();
        }
      },
    };
  },
  mounted() {
    console.log('Component mounted at:', new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
    this.fetchStats();
    this.initCharts();
    this.fetchTrendData();
    // this.refreshTrendCache();
    // setInterval(this.refreshTrendCache, 3600000); // 3600000 毫秒 = 1 小时
    this.scheduleMidnightRefresh();
    this.fetchAdditionalChartData();
    this.fetchLatestReport();  // 新增
  },
  methods: {
    fetchLatestReport() {
      axios.get('/api/latestreport/')
        .then(response => {
          this.dailyReport = response.data.content; // 初始化时设置为最新日报内容
        })
        .catch(error => {
          console.error('Error fetching latest report:', error);
        });
    },
    startEditing() {
      this.isEditing = true;
      this.dailyReport = ''; // 清空文本框内容，准备输入新的日报
    },
    cancelEditing() {
      this.isEditing = false;
      this.fetchLatestReport(); // 取消编辑后恢复显示最新日报内容
    },
    saveReport() {
      const reportData = {
        report_date: new Date().toISOString().split('T')[0], // 当前日期
        content: this.dailyReport
      };

      axios.post('/api/savereport/', reportData)
        .then(response => {
          ElMessage.success('日报保存成功');
          this.isEditing = false;
          this.fetchLatestReport(); // 保存后刷新显示最新日报内容
        })
        .catch(error => {
          console.error(error);
          ElMessage.error('日报保存失败');
        });
    },
    fetchStats() {
      axios.get('/api/datastatus/')
        .then(response => {
          this.stats[0].value.total = response.data.total_samples;
          this.stats[0].value.valid = response.data.valid_samples;
          this.stats[1].value = response.data.cells;
          this.stats[2].value = response.data.regions;
        })
        .catch(error => {
          console.error(error);
        });
    },
    initChart() {
      this.chart = echarts.init(this.$refs.chartContainer);
    },
    fetchTrendData() {
      const params = {};
      if (this.dateRange.length === 2) {
        params.start_date = new Date(this.dateRange[0]).toISOString().split('T')[0];
        params.end_date = new Date(this.dateRange[1]).toISOString().split('T')[0];
      }

      if (!params.start_date && !params.end_date) {
        // 检查缓存
        const cachedData = localStorage.getItem('productionTrend');
        if (cachedData) {
          const response = JSON.parse(cachedData);
          this.updateChart(response);
          return;
        }
      }

      this.loading = true;  // 开始加载
      axios.get('/api/productiontrend/', {
        params,
        timeout: 5000,
      })
      .then(response => {
        // 全部生产日期的数据缓存
        if (!params.start_date && !params.end_date) {
          localStorage.setItem('productionTrend', JSON.stringify(response.data));
        }
        this.updateChart(response.data);
      })
      .finally(() => {
        this.loading = false;  // 加载完成
      });
    },
    updateChart(data) {
      const dates = data.dates;
      const totalValues = data.totalValues;
      const dailyValues = data.dailyValues;
      this.minDate = data.minDate;
      this.maxDate = data.maxDate;

      this.datePickerOptions = {
        disabledDate: (time) => {
          const minDate = new Date(this.minDate);
          const maxDate = new Date(this.maxDate);
          return time.getTime() < minDate.getTime() || time.getTime() > maxDate.getTime();
        }
      };

      this.chart.setOption({
        xAxis: {
          data: dates,
        },
        yAxis: [
          {
            type: 'value',
            name: '总生产量',
            position: 'left',
            minInterval: 1,
          },
          {
            type: 'value',
            name: '每日生产量',
            position: 'right',
            minInterval: 1,
          }
        ],
        series: [
          {
            name: '总生产量',
            data: totalValues,
            type: 'line',
            yAxisIndex: 0,
          },
          {
            name: '每日生产量',
            data: dailyValues,
            type: 'bar',
            yAxisIndex: 1,
          }
        ],
      });
    },
    refreshTrendCache() {
      console.log('Refreshing trend cache at:', new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
      axios.get('/api/productiontrend/', {
        timeout: 5000,
      })
      .then(response => {
        localStorage.setItem('productionTrend', JSON.stringify(response.data));
        console.log('Production trend cache updated at:', new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
      })
      .catch(error => {
        console.error('Error refreshing trend cache:', error);
      });
    },
    scheduleMidnightRefresh() {
      // 从当前时间到下一个零点的时间间隔，并设置一个 setTimeout 在下一个零点触发 refreshTrendCache
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const timeUntilMidnight = midnight.getTime() - now.getTime();
      // 通过 setInterval 每24小时再次触发 refreshTrendCache
      setTimeout(() => {
        this.refreshTrendCache();
        setInterval(this.refreshTrendCache, 24 * 60 * 60 * 1000); // 每24小时刷新一次
      }, timeUntilMidnight);
    },

    fetchAdditionalChartData() {
      this.fetchAgeDistribution();
      this.fetchBrainRegionDistribution();
      this.fetchIhcDistribution();
    },
    fetchAgeDistribution() {
      axios.get('/api/age-distribution')
        .then(response => {
          this.ageChart.setOption({
            tooltip: {
              trigger: 'item'
            },
            legend: {
              top: '5%',
              left: 'center'
            },
            series: [
              {
                name: '年龄分布',
                type: 'pie',
                radius: '70%',
                avoidLabelOverlap: false,
                itemStyle: {
                  borderRadius: 10,
                  borderColor: '#fff',
                  borderWidth: 2
                },
                label: {
                  formatter: '{c} ({d}%)',
                  color: 'black'
                },
                data: response.data
              }
            ]
          });
        })
        .catch(error => {
          console.error('Error fetching age distribution:', error);
        });
    },
    fetchBrainRegionDistribution() {
      axios.get('/api/brain-region-distribution')
        .then(response => {
          this.brainRegionChart.setOption({
            tooltip: {
              trigger: 'axis',
              axisPointer: {
                type: 'shadow'
              }
            },
            xAxis: {
              type: 'category',
              data: response.data.categories,
              axisLabel: {
                interval: 0, // 显示所有标签
                rotate: 45  // 旋转标签以避免重叠
              }
            },
            yAxis: {
              type: 'value'
            },
            series: [
              {
                data: response.data.data,
                type: 'bar',
                label: {
                  show: true,
                  position: 'top',
                  formatter: '{c}'
                },
                itemStyle: {
                  color: '#83bff6'
                }
              }
            ]
          });
        })
        .catch(error => {
          console.error('Error fetching brain region distribution:', error);
        });
    },
    fetchIhcDistribution() {
      axios.get('/api/immunohistochemistry-distribution')
        .then(response => {
          this.ihcChart.setOption({
            tooltip: {
              trigger: 'item'
            },
            legend: {
              top: '5%',
              left: 'center'
            },
            series: [
              {
                name: '免疫组化分布',
                type: 'pie',
                radius: '70%',
                avoidLabelOverlap: false,
                itemStyle: {
                  borderRadius: 10,
                  borderColor: '#fff',
                  borderWidth: 2
                },
                label: {
                  formatter: '{c} ({d}%)',
                  color: 'black'
                },
                data: response.data
              }
            ]
          });
        })
        .catch(error => {
          console.error('Error fetching IHC distribution:', error);
        });
    },

    initCharts() {
      this.chart = echarts.init(this.$refs.chartContainer);
      this.chart.setOption({
        tooltip: {
          trigger: 'axis',
        },
        legend: {
          data: ['总生产量', '每日生产量'],
        },
        xAxis: {
          type: 'category',
          data: [],
        },
        yAxis: [
          {
            type: 'value',
            name: '总生产量',
            position: 'left',
            minInterval: 1,
          },
          {
            type: 'value',
            name: '每日生产量',
            position: 'right',
            minInterval: 1,
          }
        ],
        series: [
          {
            name: '总生产量',
            data: [],
            type: 'line',
            yAxisIndex: 0,
          },
          {
            name: '每日生产量',
            data: [],
            type: 'bar',
            yAxisIndex: 1,
          }
        ],
      });

      // 初始化患者年龄分布图
      this.ageChart = echarts.init(this.$refs.ageChartContainer);
      this.ageChart.setOption({
        tooltip: {
          trigger: 'item'
        },
        legend: {
          top: '5%',
          left: 'center'
        },
        series: [
          {
            name: '年龄分布',
            type: 'pie',
            radius: '50%',
            label: {
              formatter: '{b}: {c} ({d}%)',
              color: 'black'
            },
            data: []
          }
        ]
      });

      // 初始化脑区分布图
      this.brainRegionChart = echarts.init(this.$refs.brainRegionChartContainer);
      this.brainRegionChart.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        xAxis: {
          type: 'category',
          data: []
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            data: [],
            type: 'bar',
            label: {
              show: true,
              position: 'top',
              formatter: '{c}'
            },
            itemStyle: {
              color: '#83bff6'
            }
          }
        ]
      });

      // 初始化免疫组化分布图
      this.ihcChart = echarts.init(this.$refs.ihcChartContainer);
      this.ihcChart.setOption({
        tooltip: {
          trigger: 'item'
        },
        legend: {
          top: '5%',
          left: 'center'
        },
        series: [
          {
            name: '免疫组化分布',
            type: 'pie',
            radius: '50%',
            label: {
              formatter: '{b}: {c} ({d}%)',
              color: 'black'
            },
            data: []
          }
        ]
      });
    }
  }
};
</script>
           

<style scoped>
.data-status-container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px;
  gap: 30px; /* 增加不同部分的间隔 */
}
.top-section {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
.left-section {
  width: 75%;
}
.right-section {
  width: 23%;
}
.stats-boxes {
  display: flex;
  justify-content: space-between;
  margin-bottom: 25px;
  gap: 30px;
}
.stat-box {
  width: 30%;
  text-align: center;
  padding: 20px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.stat-title {
  font-size: 18px;
  margin-bottom: 10px;
}
.stat-value {
  font-size: 28px;
  font-weight: bold;
}
.trend-chart {
  margin-top: 20px;
}
.bottom-section {
  width: 100%;
}
.additional-charts {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  gap: 10px;
}
.additional-charts .el-card {
  width: 30%;
  padding: 20px;
}
</style>







