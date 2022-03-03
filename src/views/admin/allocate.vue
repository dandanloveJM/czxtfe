<template>
  <div class="doneTask__container">
    <div class="button-wrapper">
<a-button type="primary" @click="openModal">分配产值</a-button>
    </div>
    
    <div class="table-wrapper">
      <div class="tableWithData" v-if="state.taskList.length > 0">
        <header class="header-wrapper">
          <CalendarTwoTone />
          <span>按年度筛选：</span>
          <a-select
            ref="select"
            v-model:value="value1"
            style="width: 120px"
            :options="options1"
            @change="handleChange"
          >
          </a-select>
        </header>
        <a-table
          :columns="columns"
          :data-source="state.taskList"
          :rowKey="(record) => record.rankId"
          :loading="tableLoading"
        >
          <template #team="{ record }">
            <span>{{ TEAM_MAP[record.team] }}</span>
          </template>
        </a-table>
      </div>
      <div class="emptyTable" v-else>
        <a-empty />
      </div>
    </div>

    <div v-drag-modal>
      <a-modal
        ref="addModal"
        title="填写产值比例建议"
        v-model:visible="visible"
        :confirm-loading="confirmLoading"
        @ok="onSubmitForm"
        @cancel="onCancel"
        width="1000px"
        :destroyOnClose="true"
      >
        <template #footer>
          <a-button key="back" @click="handleCancel">暂存并关闭</a-button>
          <a-button
            key="submit"
            type="primary"
            :loading="confirmLoading"
            @click="onSubmitForm"
            >确认并发送
          </a-button>
        </template>
        <a-form ref="formRef" :model="dynamicForm" :label-col="labelCol">
          <a-form-item>
            <div class="radio-wrapper">
              <div class="radio-tip">分配产值选择：</div>
              <a-radio-group name="radioGroup" v-model:value="radioValue">
                <a-radio value="R4">20%待分配产值</a-radio>
                <a-radio value="R5">10%待分配产值</a-radio>
              </a-radio-group>
            </div>
          </a-form-item>
          <div
            class="line-wrapper"
            v-for="(record, index) in dynamicForm.records"
            :key="index"
          >
            <a-form-item
              :label="record.peopleLabel"
              style="min-width: 45%"
              name="peopleValue"
            >
              <a-select
                v-model:value="record.peopleValue"
                show-search
                :options="state.candidates"
                :filterOption="filterOption"
              />
            </a-form-item>
            <a-form-item
              name="productValue"
              ref="productValue"
              :label="record.productLabel"
              style="min-width: 35%"
            >
              <a-input-number v-model:value="record.productValue" :min="0" />
            </a-form-item>
            <a-button
              danger
              v-if="dynamicForm.records.length > 1"
              class="dynamic-delete-button"
              :disabled="dynamicForm.records.length === 1"
              @click="removeRecord(record)"
            >
              删除
            </a-button>
          </div>

          <a-form-item>
            <a-button
              type="dashed"
              class="add-record-button"
              @click="addRecord"
              size="large"
              style="width: 100%"
            >
              <PlusOutlined />
              点击增加人员
            </a-button>
          </a-form-item>
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
  watchEffect,
} from "vue";
import { teamMap } from "@/utils/config";
import { getTeamBonus, getAllR1R2R3Users } from "@/api/display";
import { reallocateProduct } from "@/api/admin";
import { CalendarTwoTone, PlusOutlined } from "@ant-design/icons-vue";
import { SelectTypes } from "ant-design-vue/es/select";
import { message, Modal as antModal } from "ant-design-vue";
import localStorageStore from "@/utils/localStorageStore";

interface PeopleAndProductRecord {
  peopleLabel: string;
  peopleValue: string;
  productLabel: string;
  productValue: number;
}

export default defineComponent({
  name: "el_user_rank",
  components: {
    aIcon,
    CalendarTwoTone,
    PlusOutlined,
  },
  setup() {
    const TEAM_MAP = teamMap;
    const state = reactive({
      taskList: [],
      candidates: [],
      userIdToNameMap: {},
    });

    const tableLoading = ref<boolean>(false);
    const visible = ref<boolean>(false);
    const confirmLoading = ref<boolean>(false);
    const radioValue = ref<string>("R4");

    const columns = [
      {
        title: "排名",
        dataIndex: "rankId",
        key: "rankId",
      },
      {
        title: "部门",
         slots: { customRender: "team" },
        key: "team",
      },
      {
        title: "20%产值待分配",
        dataIndex: "r4Bonus",
        key: "r4Bonus",
      },
      {
        title: "10%产值待分配",
        dataIndex: "r5Bonus",
        key: "r5Bonus",
      },
    ];

    const fetchData = async (year: number) => {
      const data = await getTeamBonus(year).then((response) => {
        tableLoading.value = false;
        return response.data.data;
      });
      if (data.length === 0) {
        state.taskList = [];
      }

      state.taskList = data;
    };

    const fetchCandidates = async () => {
      const candidates = await getAllR1R2R3Users().then(
        (response) => response.data.data
      );
      const options = candidates.map((item) => {
        let tmp = {};
        tmp["value"] = item["id"];
        tmp["label"] = item["displayName"];
        return tmp;
      });
      state.candidates = options;
      const idNameMap = candidates.reduce((accumulator, currentValue) => {
        let id = currentValue["id"];
        let name = currentValue["displayName"];
        accumulator[id] = name;
        return accumulator;
      }, {});
      state.userIdToNameMap = idNameMap;
    };

    onMounted(() => {
      fetchCandidates();
      fetchData(2022);
    });

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

    const handleChange = (value: string) => {
      const year = Number(value);
     
      tableLoading.value = true;
      fetchData(year);
    };

    const openModal = () => {
      visible.value = true;
      dynamicForm.records = localStorageStore.getCache("reallocate") || [
        {
          peopleLabel: "项目成员",
          peopleValue: "",
          productLabel: "产值",
          productValue: 0,
        },
      ];
    };

    const dynamicForm: UnwrapRef<{
      records: PeopleAndProductRecord[];
    }> = reactive({
      records: [
        {
          peopleLabel: "项目成员",
          peopleValue: "",
          productLabel: "产值",
          productValue: 0,
        },
      ],
    });

    const addRecord = () => {
      dynamicForm.records.push({
        peopleLabel: "项目成员",
        peopleValue: "",
        productLabel: "产值",
        productValue: 0,
      });
    };
    const onCancel = () => {
      visible.value = false;
    };

    const checkForDuplicates = (array) => {
      return new Set(array).size !== array.length;
    };

    const buildParam = (records) => {
      const param = {};
      param["bonusType"] = radioValue.value;

      const data = records.map((item) => {
        let temp = {};
        temp["userId"] = "" + item.peopleValue;
        temp["product"] = "" + item.productValue;
        temp["displayName"] = toRaw(state.userIdToNameMap)[item.peopleValue];
        return temp;
      });
      param["data"] = JSON.stringify(data);
      return param;
    };

    const onSubmitForm = () => {
      const records = toRaw(dynamicForm).records;
      let sum = 0;
      const peoples = records.map((item) => item.peopleValue);
      const isDuplicates = checkForDuplicates(peoples);
      let isError = 0;
      if (isDuplicates) {
        isError += 1;
        message.error("项目成员不可以相同");
        return;
      }

      records.forEach((element) => {
        if (element.peopleValue === "") {
          message.error("请选择一位项目成员");
          isError += 1;
          return;
        } else if (
          !element.productValue ||
          !Number.isInteger(element.productValue)
        ) {
          isError += 1;
          message.error("产值比例建议填写错误,需要为正整数");
          return;
        }
      });

      if (isError === 0) {

        message.success("填写成功，正在上传数据中");
        // TODO 构造参数 发送请求
        confirmLoading.value = true;

        let params = buildParam(records);
  
        reallocateProduct(params)
          .then((response) => {
            // 删除本地缓存
            localStorageStore.deleteCache('reallocate');
            confirmLoading.value = false;
            if (response.data.status === "ok") {
              visible.value = false;
              message.success("数据上传成功");
              fetchData(2022);
            } else {
              message.error("程序异常");
            }
          })
          .catch((err) => {
            confirmLoading.value = false;
            message.error("程序异常");
          });
      }
    };
    const handleCancel = () => {
      localStorageStore.setCache("reallocate", dynamicForm.records);
      visible.value = false;
    };
    const filterOption = (input: string, option: any) => {
      return option.label.indexOf(input) >= 0;
    };
    const removeRecord = (item) => {
      let index = dynamicForm.records.indexOf(item);
      if (index !== -1) {
        dynamicForm.records.splice(index, 1);
      }
    };

    return {
      state,
      columns,
      TEAM_MAP,
      value1: ref("2022"),
      options1,
      handleChange,
      tableLoading,
      dynamicForm,
      openModal,
      addRecord,
      onCancel,
      visible,
      confirmLoading,
      onSubmitForm,
      filterOption,
      labelCol: { style: { width: "150px", textAlign: "center" } },
      handleCancel,
      removeRecord,
      radioValue,
    };
  },
});
</script>
<style lang="scss" scoped>
.table-wrapper {
  padding: 20px;
  .header-wrapper {
    font-size: 20px;
    line-height: 1.5;
    margin-bottom: 30px;
  }
}
.line-wrapper {
  display: flex;
  justify-content: flex-start;
}
.radio-wrapper {
  display: flex;
  justify-content: flex-start;
  .radio-tip {
    width: 150px;
    text-align: center;
  }
}

.doneTask__container {
  .button-wrapper {
    margin-top: 30px;
    margin-left: 20px;
  }
}
</style>
