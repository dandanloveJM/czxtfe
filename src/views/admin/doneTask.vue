<template>
  <div class="doneTask__container">
    <div class="filters-wrapper">
      <div class="search-filter-wrapper">
        <a-form ref="filter-form" :model="filterFormState" layout="inline">
          <a-form-item name="name" label="项目名称">
            <a-input v-model:value="filterFormState.name" />
          </a-form-item>
          <a-form-item name="type" label="项目类型">
            <a-select
              v-model:value="filterFormState.type"
              show-search
              :options="typeOptions"
              style="width: 120px"
              :filterOption="filterOption"
              :allowClear="true"
            />
          </a-form-item>
          <a-form-item name="number" label="项目编号">
            <a-input v-model:value="filterFormState.number" />
          </a-form-item>
          <a-form-item name="year" label="按年度筛选">
            <a-select
              v-model:value="filterFormState.year"
              style="width: 120px"
              :options="options1"
            />
          </a-form-item>
          <a-form-item :wrapper-col="wrapperCol">
            <a-button type="primary" @click="searchFilters">搜索</a-button>
          </a-form-item>
        </a-form>
      </div>
    </div>

    <div class="table-wrapper">
      <div class="tableWithData" v-if="state.taskList.length > 0">
        <a-table
          :columns="columns"
          :data-source="state.taskList"
          :rowKey="(record) => record.processId"
          :loading="tableLoading"
        >
          <template #updatedAt="{ record }">
            <span>{{ changeTime(record.updatedAt) }}</span>
          </template>
          <template #type="{ record }">
            <span>{{ TYPE_MAP[record.type] }}</span>
          </template>
          <template #totalPercentage="{ record }">
            <a-tag v-if="record.totalPercentage < 100" color="warning">{{
              record.totalPercentage + "%"
            }}</a-tag>
            <span v-else>{{ record.totalPercentage + "%" }}</span>
          </template>
          <template #attachment="{ record }">
            <a-button @click="() => showImg(record.attachment)"
              >查看任务书</a-button
            >
          </template>
          <template #products="{ record }">
            <a-button @click="() => showProducts(record.products)"
              >查看产值</a-button
            >
          </template>
          <template #action="{ record }">
            <span>
              <a-button @click="() => checkHistory(record.processId)">
                流程查看
              </a-button>
            </span>
            <a-divider type="vertical" />
            <span>
              <a-button
                primary
                danger
                @click="() => deleteTask(record.processId)"
              >
                删除项目
              </a-button>
            </span>
          </template>
        </a-table>
      </div>
      <div class="emptyTable" v-else>
        <a-empty />
      </div>
    </div>

    <div v-drag-modal>
      <a-modal
        title="查看团队成员产值详情"
        v-model:visible="visible"
        @ok="productsOk"
        width="1000px"
        :destroyOnClose="true"
      >
        <a-table
          :columns="productColumns"
          :data-source="state.products"
          :rowKey="(record) => record.id"
        >
          <template #percentage="{ record }">
            <span>{{ record.percentage + "%" }}</span>
          </template>
        </a-table>
      </a-modal>
    </div>

    <div v-drag-modal>
      <a-modal
        title="查看附件原图"
        v-model:visible="showPreview"
        width="1200px"
        :destroyOnClose="true"
        :footer="null"
      >
        <img :src="state.previewURL" style="max-width: 1100px" />
      </a-modal>
    </div>

    <div v-drag-modal>
      <a-modal
        ref="history"
        title="查看当前审批流程"
        v-model:visible="showHistory"
        @ok="historyOk"
        width="1000px"
        :destroyOnClose="true"
      >
        <a-spin v-if="historyLoading" />
        <a-table
          v-else
          :dataSource="state.historyData"
          :columns="historyColumns"
          :rowKey="(record) => record.processId"
        >
          <template #comment="{ record }">
            <span>{{ record.comment ? record.comment : "无" }}</span>
          </template>
        </a-table>
      </a-modal>
    </div>
  </div>
</template>
<script lang="ts">
import aIcon from "@/components/aicon/aicon.vue";
import {
  defineComponent,
  ref,
  reactive,
  onMounted,
  UnwrapRef,
  toRaw,
  watchEffect,
  createVNode,
  computed,
} from "vue";
import { ExclamationCircleOutlined } from "@ant-design/icons-vue";
import { typeMap, TYPE_OPTIONS } from "@/utils/config";
import { getAdminAllList } from "@/api/admin";
import Modal from "@/components/tableLayout/modal.vue";
import { message, Modal as antModal } from "ant-design-vue";
import moment from "moment";
import { SelectTypes } from "ant-design-vue/es/select";
import { deleteProject, checkHistoryRequest } from "@/api/display";
interface filterFormState {
  name: string;
  number: string;
  type: string;
  year: string;
}

export default defineComponent({
  name: "el_done",
  components: {
    aIcon,
    Modal,
    antModal,
    ExclamationCircleOutlined,
  },
  setup() {
    const TYPE_MAP = typeMap;
    const state = reactive({
      taskList: [],
      products: [],
      previewURL: "",
      historyData: [],
    });
    const visible = ref<boolean>(false);
    const tableLoading = ref<boolean>(false);
    const showPreview = ref<boolean>(false);
    const showHistory = ref<boolean>(false);
    const historyLoading = ref<boolean>(false);

    const columns = [
      {
        title: "任务名",
        dataIndex: "name",
        key: "name",
      },
      {
        title: "任务书编号",
        dataIndex: "number",
        key: "number",
      },
      {
        title: "任务类型",
        slots: { customRender: "type" },
        key: "type",
      },
      {
        title: "完成时间",
        slots: { customRender: "updatedAt" },
        key: "updatedAt",
      },
      {
        title: "任务总产值",
        dataIndex: "totalProduct",
        key: "totalProduct",
        sorter: (a, b) => a.totalProduct - b.totalProduct,
      },
      {
        title: "完成比例",
        slots: { customRender: "totalPercentage" },
        key: "totalPercentage",

        sorter: (a, b) => a.totalPercentage - b.totalPercentage,
      },
      {
        title: "查看附件",
        slots: { customRender: "attachment" },
        key: "attachment",
      },
      {
        title: "查看团队成员产值情况",
        slots: { customRender: "products" },
        key: "products",
      },
      {
        title: "操作",
        key: "action",
        slots: { customRender: "action" },
      },
    ];

    const productColumns = [
      {
        title: "团队成员",
        dataIndex: "displayName",
        key: "displayName",
      },
      {
        title: "承担比例",
        slots: { customRender: "percentage" },
        key: "percentage",
      },
      {
        title: "承担产值",
        dataIndex: "product",
        key: "product",
      },
    ];

    const historyColumns = [
      {
        title: "时间",
        dataIndex: "time",
        key: "time",
      },
      {
        title: "流程节点",
        dataIndex: "activityName",
        key: "activityName",
      },
      {
        title: "操作人",
        dataIndex: "displayName",
        key: "displayName",
      },
      {
        title: "审核意见",
        slots: { customRender: "comment" },
        key: "comment",
      },
    ];
    const fetchData = async (
      name: string,
      number: string,
      type: string,
      year: string
    ) => {
      const data = await getAdminAllList(name, number, type, year).then(
        (response) => {
          tableLoading.value = false;
          return response.data.data;
        }
      );
      if (data.hasOwnProperty("empty")) {
        state.taskList = [];
      } else {
        state.taskList = data.finished;
      }
    };

    onMounted(() => {
      fetchData("", "", "", "2022");
    });

    const showProducts = (products) => {
      // 1.打开Modal 2.存数据
      visible.value = true;
      state.products = products;
    };
    const productsOk = () => {
      // 1.关闭modal, 2. 清空state.products
      visible.value = false;
      state.products = [];
    };
    const changeTime = (time) => {
      return moment(time).add(8, "hours").format("lll");
    };

    const createFilterFormState = () => ({
      name: "",
      number: "",
      type: "",
      year: "2022",
    });
    const typeOptions = TYPE_OPTIONS;

    const filterFormState: UnwrapRef<filterFormState> = reactive(
      createFilterFormState()
    );

    const searchFilters = () => {
      // 拿到filterFormState数据，拼接参数, 发送fetchData请求, 设置loading
      const formData = toRaw(filterFormState);
      const values = Object.values(formData);
      console.log("我看看参数");
      console.log(values);
      tableLoading.value = true;

      if (values.length == 4) {
        fetchData(values[0], values[1], values[2], values[3]);
      }
    };

    const options1 = ref<SelectTypes["options"]>([
      {
        value: "2022",
        label: "2022",
      },
      {
        value: "2023",
        label: "2023",
      },

      {
        value: "2024",
        label: "2024",
      },
    ]);

    const filterOption = (input: string, option: any) => {
      return option.label.indexOf(input) >= 0;
    };
    const showImg = (srcURL) => {
      showPreview.value = true;
      state.previewURL = srcURL;
    };

    const deleteTask = (processId: string) => {
      antModal.confirm({
        title: "您确认删除此项目吗？",
        icon: createVNode(ExclamationCircleOutlined),
        onOk() {
          deleteProject(processId)
            .then((response) => {
              message.success("删除成功");
              fetchData("", "", "", "2022");
            })
            .catch((err) => {
              console.log(err);
            });
        },
        onCancel() {
          console.log("Cancel");
        },
        class: "test",
      });
    };

    const checkHistory = (processId: string) => {
      showHistory.value = true;
      historyLoading.value = true;
      console.log(showHistory.value);
      checkHistoryRequest(processId)
        .then((response) => {
          const historyData = response.data.data;
          state.historyData = historyData;
          historyLoading.value = false;
        })
        .catch((err) => {
          message.error("程序异常");
        });
    };

    const historyOk = () => {
      showHistory.value = false;
      state.historyData = [];
    };

    return {
      TYPE_MAP,
      state,
      columns,
      productColumns,
      productsOk,
      showProducts,
      visible,
      changeTime,

      filterFormState,
      tableLoading,
      searchFilters,
      typeOptions,
      wrapperCol: { span: 14, offset: 4 },
      options1,
      filterOption,
      showImg,
      showPreview,
      deleteTask,

      checkHistory,
      historyOk,
      showHistory,
      historyLoading,
      historyColumns,
    };
  },
});
</script>
<style lang="scss" scoped>
.filters-wrapper {
  margin-top: 30px;
  margin-bottom: 30px;
  display: flex;
  align-items: center;

  .search-filter-wrapper {
    .ant-form {
      display: flex;
    }
  }
  .table-wrapper {
    padding: 20px;
  }

  .header-wrapper {
    font-size: 20px;
    line-height: 1.5;
    margin-left: 40px;
  }
}
.doneTask__container {
  padding: 0 20px;
}
</style>