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
          rows="35"
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
          <div ref="ageChartContainer" style="width: 100%; height: 500px;"></div>
        </el-card>
        <el-card>
          <h3>脑区分布(前十)</h3>
          <div ref="brainRegionChartContainer" style="width: 100%; height: 500px;"></div>
        </el-card>
      </div>
      <div class="additional-charts">
        <el-card>
          <h3>有效样本来源</h3>
          <div ref="sampleSourceChartContainer" style="width: 100%; height: 500px;"></div>
        </el-card>
        <el-card>
          <h3>免疫组化情况</h3>
          <div ref="ihcChartContainer" style="width: 100%; height: 500px;"></div>
        </el-card>

      </div>
    </div>
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="50%">
      <div v-html="dialogContent"></div>
      <div ref="brainRegionChart" style="width: 100%; height: 400px; margin-top: 20px;"></div>
    </el-dialog>
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
      isEditing: false,
      chart: null,
      ageChart: null,
      brainRegionChart: null,
      ihcChart: null,
      sampleSourceChart: null,
      minDate: '',
      maxDate: '',
      datePickerOptions: {
        disabledDate: (time) => {
          const minDate = new Date(this.minDate);
          const maxDate = new Date(this.maxDate);
          return time.getTime() < minDate.getTime() || time.getTime() > maxDate.getTime();
        }
      },
      dialogVisible: false,
      dialogContent: '',
      dialogTitle: '',
      brainRegionChart: null // 脑区分布图表实例
    };
  },
  mounted() {
    this.fetchStats();
    this.initCharts();
    this.fetchTrendData();
    this.scheduleMidnightRefresh();
    this.fetchAdditionalChartData();
    this.fetchLatestReport();
  },
  watch: {
    dialogVisible(val) {
      if (val) {
        this.$nextTick(() => {
          if (this.brainRegionChartInstance) {
            this.brainRegionChartInstance.resize(); // 确保在对话框打开时图表大小正确
          }
        });
      }
    }
  },
  methods: {
    fetchLatestReport() {
      axios.get('/api/latestreport/')
        .then(response => {
          this.dailyReport = response.data.content;
        })
        .catch(error => {
          console.error('Error fetching latest report:', error);
        });
    },
    startEditing() {
      this.isEditing = true;
      this.dailyReport = '';
    },
    cancelEditing() {
      this.isEditing = false;
      this.fetchLatestReport();
    },
    saveReport() {
      const reportData = {
        report_date: new Date().toISOString().split('T')[0],
        content: this.dailyReport
      };

      axios.post('/api/savereport/', reportData)
        .then(response => {
          ElMessage.success('日报保存成功');
          this.isEditing = false;
          this.fetchLatestReport();
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
        const cachedData = localStorage.getItem('productionTrend');
        if (cachedData) {
          const response = JSON.parse(cachedData);
          this.updateChart(response);
          return;
        }
      }

      this.loading = true;
      axios.get('/api/productiontrend/', {
        params,
        timeout: 5000,
      })
      .then(response => {
        if (!params.start_date && !params.end_date) {
          localStorage.setItem('productionTrend', JSON.stringify(response.data));
        }
        this.updateChart(response.data);
      })
      .finally(() => {
        this.loading = false;
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
      axios.get('/api/productiontrend/', {
        timeout: 5000,
      })
      .then(response => {
        localStorage.setItem('productionTrend', JSON.stringify(response.data));
      })
      .catch(error => {
        console.error('Error refreshing trend cache:', error);
      });
    },
    scheduleMidnightRefresh() {
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const timeUntilMidnight = midnight.getTime() - now.getTime();
      setTimeout(() => {
        this.refreshTrendCache();
        setInterval(this.refreshTrendCache, 24 * 60 * 60 * 1000);
      }, timeUntilMidnight);
    },
    fetchAdditionalChartData() {
      this.fetchAgeDistribution();
      this.fetchBrainRegionDistribution();
      this.fetchIhcDistribution();
      this.fetchSampleSourceDistribution();
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
                interval: 0,
                rotate: 45
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
    fetchSampleSourceDistribution() {
      axios.get('/api/sample-source-distribution')
        .then(response => {
          const categories = response.data.categories;
          const data = response.data.data;
          const sourcePatientNumbers = response.data.source_patient_numbers;
          const patientCellCount = response.data.patient_cell_count; // 获取每个 patient_number 的细胞数量
          const sourceCellCount = response.data.source_cell_count;
          const sourceBrainRegionDistribution = response.data.source_brain_region_distribution;

          this.sampleSourceChart.setOption({
            tooltip: {
              trigger: 'axis',
              axisPointer: {
                type: 'shadow'
              }
            },
            xAxis: {
              type: 'category',
              data: categories,
              axisLabel: {
                interval: 0,
                rotate: 45
              }
            },
            yAxis: {
              type: 'value'
            },
            series: [
              {
                data: data,
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

          // Add event listener for click event
          this.sampleSourceChart.on('click', (params) => {
            const source = categories[params.dataIndex];
            const patients = sourcePatientNumbers[source];
            const cellCount = sourceCellCount[source];
            const brainRegionDistribution = sourceBrainRegionDistribution[source];

            // Calculate total patient numbers and valid patient numbers
            const totalPatientCount = patients.length;
            const validPatientCount = patients.filter(patient => patientCellCount[patient] > 0).length;

            // Generate patient numbers with cell counts in parentheses
            const patientInfo = patients.map(patient => `${patient} (${patientCellCount[patient]})`).join(', ');

            // Prepare dialog content
            this.dialogTitle = `Details for Source: ${source}`;
            this.dialogContent = `
              <strong>Patient Numbers:</strong> ${totalPatientCount}(有效样本数)/${validPatientCount}(有效数据样本数)<br/>
              ${patientInfo}<br/>
              <strong>Total Cell Count:</strong> ${cellCount}<br/>
              <strong>Brain Region Distribution:</strong><br/>
              ${Object.entries(brainRegionDistribution).map(([region, count]) => `${region}: ${count}`).join('<br/>')}
            `;
            this.dialogVisible = true; // Show the dialog

            // Initialize or update the brain region chart
            this.$nextTick(() => {
              if (!this.brainRegionChartInstance) {
                this.brainRegionChartInstance = echarts.init(this.$refs.brainRegionChart);
              }
              const brainRegionData = Object.entries(brainRegionDistribution).map(([region, count]) => ({ name: region, value: count }));

              this.brainRegionChartInstance.setOption({
                tooltip: {
                  trigger: 'item'
                },
                series: [
                  {
                    name: 'Brain Region Distribution',
                    type: 'pie',
                    radius: '70%',
                    data: brainRegionData,
                    emphasis: {
                      itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                      }
                    }
                  }
                ]
              });
            });
          });
        })
        .catch(error => {
          console.error('Error fetching sample source distribution:', error);
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

      this.sampleSourceChart = echarts.init(this.$refs.sampleSourceChartContainer);
      this.sampleSourceChart.setOption({
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
  gap: 30px;
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
  width: 47%;
  padding: 18px;
}
</style>
