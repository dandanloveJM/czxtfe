<template>
  <div class="doneTask__container">
    <h2 class="header">团队人数管理</h2>
    <div class="filters-wrapper">
      <div class="button-wrapper">
        <a-button type="primary" @click="showAddNewModal">修改团队人数</a-button>
      </div>
    </div>
    <div class="table-wrapper">
      <div class="tableWithData" v-if="state.taskList.length > 0">
        <a-table
          :columns="columns"
          :data-source="state.taskList"
          :rowKey="(record) => record.id"
          :loading="tableLoading"
        >
          <template #teamName="{ record }">
            <span>{{ TEAM_MAP[record.teamName] || record.teamName }}</span>
          </template>
        </a-table>
      </div>
      <div class="emptyTable" v-else>
        <a-empty />
      </div>
    </div>

    <div v-drag-modal>
      <a-modal
        title="修改团队人数"
        v-model:visible="showAddNewData"
        width="1000px"
        :destroyOnClose="true"
        :footer="null"
      >
        <a-form :model="newFormState">
          <a-form-item name="Z1" label="支持一室">
            <a-input-number
              v-model:value="newFormState.Z1"
              style="width: 120px"
            />
          </a-form-item>
          <a-form-item name="Z2" label="支持二室">
            <a-input-number
              v-model:value="newFormState.Z2"
              style="width: 120px"
            />
          </a-form-item>
          <a-form-item name="F1" label="方法一室">
            <a-input-number
              v-model:value="newFormState.F1"
              style="width: 120px"
            />
          </a-form-item>
          <a-form-item name="F2" label="方法二室">
            <a-input-number
              v-model:value="newFormState.F2"
              style="width: 120px"
            />
          </a-form-item>
          <a-button @click="submit">确认修改</a-button>
        </a-form>
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
} from "vue";
import {
  ExclamationCircleOutlined,
  CheckOutlined,
  EditOutlined,
} from "@ant-design/icons-vue";
import { teamMap } from "@/utils/config";

import { getTeamMembers, updateTeamMembers } from "@/api/display";
import Modal from "@/components/tableLayout/modal.vue";
import { message, Modal as antModal } from "ant-design-vue";
import SelectTypes from "ant-design-vue/es/select";

interface newFormState {
  Z1: number;
  Z2: number;
  F1: number;
  F2: number;
}

export default defineComponent({
  name: "el_done",
  components: {
    aIcon,
    Modal,
    antModal,
    ExclamationCircleOutlined,
    CheckOutlined,
    EditOutlined,
  },
  setup() {
    const TEAM_MAP = teamMap;

    const state = reactive({
      taskList: [],
      teamDict: {},
    });
    const visible = ref<boolean>(false);
    const tableLoading = ref<boolean>(false);

    const showAddNewData = ref<boolean>(false);

    const createNewFormState = () => ({
      Z1: 10,
      Z2: 1,
      F1: 1,
      F2: 1,
    });

    const newFormState: UnwrapRef<newFormState> = reactive(
      createNewFormState()
    );

    const columns = [
      {
        title: "团队",
        slots: { customRender: "teamName" },
        key: "teamName",
      },
      {
        title: "人数",
        dataIndex: "members",
        key: "members",
      },
    ];

    const fetchData = async () => {
      const data = await getTeamMembers().then((response) => {
        tableLoading.value = false;
        return response.data.data;
      });
      if (data.hasOwnProperty("empty")) {
        state.taskList = [];
      } else {
        state.taskList = data;
      }

      for (const item of data) {
        state.teamDict[item["teamName"]] = item["members"];
      }

      console.dir(toRaw(state.teamDict));
    };

    onMounted(() => {
      fetchData();
    });

    const filterOption = (input: string, option: any) => {
      return option.label.indexOf(input) >= 0;
    };

    const showAddNewModal = () => {
      showAddNewData.value = true;

      Object.assign(newFormState, {
        Z1: state.teamDict["Z1"],
        Z2: state.teamDict["Z2"],
        F1: state.teamDict["F1"],
        F2: state.teamDict["F2"],
      });
    };

    const submit = async () => {
      console.log("newFormState");
      console.log(toRaw(newFormState));
      const obj = toRaw(newFormState);
      const params = [];
      for (const [key, value] of Object.entries(obj)) {
        const param = {};
        param["teamName"] = key;
        param["teamMembers"] = value.toString();
        params.push(param);
      }

     await updateTeamMembers(JSON.stringify(params)).then((response) => {
        showAddNewData.value = false;
        if (response.data.status === "fail") {
          message.error(response.data.msg);
        } else {
          message.success(response.data.msg);
        
        }
      });

     await fetchData();
    };

    return {
      state,
      columns,

      visible,

      tableLoading,

      wrapperCol: { span: 14, offset: 4 },

      filterOption,

      showAddNewData,
      showAddNewModal,
      newFormState,
      submit,
      TEAM_MAP,
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
.editable-cell {
  position: relative;
  .editable-cell-input-wrapper,
  .editable-cell-text-wrapper {
    padding-right: 24px;
  }

  .editable-cell-text-wrapper {
    display: flex;
    padding: 5px 24px 5px 5px;
  }

  .editable-cell-icon,
  .editable-cell-icon-check {
    position: absolute;
    left: 50px;
    width: 20px;
    cursor: pointer;
  }

  .editable-cell-icon {
    margin-top: 4px;
    display: none;
  }

  .editable-cell-icon-check {
    line-height: 28px;
  }

  .editable-cell-icon:hover,
  .editable-cell-icon-check:hover {
    color: #108ee9;
  }

  .editable-add-btn {
    margin-bottom: 8px;
  }
}
.editable-cell:hover .editable-cell-icon {
  display: flex;
  justify-content: flex-end;
}

.doneTask__container .header {
    font-size: 28px;
    padding-top: 20px;
}

</style>
