<template>
  <div class="doneTask__container">
    <h2>用户信息</h2>

    <div class="table-wrapper">
      <div class="tableWithData" v-if="state.taskList.length > 0">
        <a-table
          :columns="columns"
          :data-source="state.taskList"
          :rowKey="(record) => record.id"
          :loading="tableLoading"
          :pagination="false"
        >
        </a-table>
      </div>
      <div class="emptyTable" v-else>
        <a-empty />
      </div>
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
} from "vue";
import { ExclamationCircleOutlined } from "@ant-design/icons-vue";
import { typeMap, TYPE_OPTIONS } from "@/utils/config";
import { getAllUsers } from "@/api/admin";
import Modal from "@/components/tableLayout/modal.vue";
import { Modal as antModal } from "ant-design-vue";
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
        title: "姓名",
        dataIndex: "displayName",
        key: "displayName",
      },
      {
        title: "用户名",
        dataIndex: "username",
        key: "username",
      },
      {
        title: "密码",
        dataIndex: "password",
        key: "password",
      },
      {
        title: "部门",
        dataIndex: "teamName",
        key: "teamName",
      },
    ];

    const fetchData = async (department:string) => {
      const data = await getAllUsers(department).then((response) => {
        tableLoading.value = false;
        return response.data.data;
      });
      state.taskList = data
    
    };

    onMounted(() => {
      fetchData("");
    });

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
        fetchData(values[0]);
      }
    };

    const filterOption = (input: string, option: any) => {
      return option.label.indexOf(input) >= 0;
    };

    return {
      TYPE_MAP,
      state,
      columns,

      visible,

      filterFormState,
      tableLoading,
      searchFilters,
      typeOptions,
      wrapperCol: { span: 14, offset: 4 },

      filterOption,

      showPreview,

      showHistory,
      historyLoading,
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
  h2 {
font-size: 20px;
margin-bottom: 20px;
  }
  
}
</style>
