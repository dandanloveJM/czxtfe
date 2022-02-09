<template>
  <div class="issue__container">
    <a-button type="primary" size="large" @click="createNewProject"
      >点击新建任务</a-button
    >
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
      <div class="tableWithData" v-if="state.taskList != null">
        <a-table
          :columns="columns"
          :data-source="state.taskList"
          :rowKey="(record) => record.processId"
          :loading="tableLoading"
        >
          <template #action="{ record }">
            <span v-if="record.activityName === 'R2/R1填写产值分配建议'">
              <a-button
                @click="() => addAdvice(record.processId, record.taskId)"
              >
                产值分配
              </a-button>
              <a-divider type="vertical" />
              <a-button @click="() => rollback(record)">节点回退</a-button>
              <a-divider type="vertical" />
            </span>
            <span v-if="record.activityName === 'R2上传任务'">
              <a-button
                @click="() => reuploadProjects(record.processId, record.taskId)"
                >重新上传任务
              </a-button>
              <a-divider type="vertical" />
            </span>

            <span>
              <a-button @click="() => checkHistory(record.processId)">
                流程查看
              </a-button>
            </span>
          </template>
          <template #type="{ record }">
            <span>{{ typeMap[record.type] }}</span>
          </template>
          <template #updatedAt="{ record }">
            <span>{{ changeTime(record.updatedAt) }}</span>
          </template>
          <template #attachment="{ record }">
            <img
              :src="record.attachment"
              style="width: 200px"
              title="点击显示详情"
              @click="() => showImg(record.attachment)"
            />
            <!-- <a :href="record.attachment">点击查看附件</a> -->
          </template>
        </a-table>
      </div>
      <div class="emptyTable" v-else>
        <a-empty />
      </div>
    </div>

    <a-modal
      ref="addModal"
      title="填写产值比例建议"
      v-model:visible="visible"
      :confirm-loading="confirmLoading"
      @ok="onSubmitForm"
      @cancel="onCancel"
      width="1000px"
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
            <a-input-number
              v-model:value="record.productValue"
              :formatter="(value) => `${value}%`"
              :parser="(value) => value.replace('%', '')"
            />
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
          >
            <PlusOutlined />
            点击增加项目成员
          </a-button>
        </a-form-item>
      </a-form>
    </a-modal>

    <Modal
      ref="history"
      title="查看当前审批流程"
      v-model:visible="showHistory"
      @ok="historyOk"
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
    </Modal>

    <Modal
      ref="reject"
      title="退回到上一流程"
      v-model:visible="showRollback"
      @ok="rollbackOk"
      :confirm-loading="confirmLoading2"
    >
      <a-form ref="formRef2" :model="commentForm">
        <a-form-item name="comment" label="审批意见及退回原因">
          <a-input v-model:value="commentForm.comment" />
        </a-form-item>
      </a-form>
    </Modal>

    <Modal
      ref="createProject"
      title="创建新任务"
      v-model:visible="showNewProject"
      @ok="createProjectOk"
    >
      <a-form ref="formRef3" :model="newFormState" :rules="projectRules">
        <a-form-item name="name" label="项目名称">
          <a-input v-model:value="newFormState.name" />
        </a-form-item>
        <a-form-item name="type" label="项目类型">
          <a-select
            v-model:value="newFormState.type"
            show-search
            :options="typeOptions"
            :filterOption="filterOption"
          />
        </a-form-item>
        <a-form-item name="number" label="项目编号">
          <a-input v-model:value="newFormState.number" />
        </a-form-item>
        <a-form-item name="nextAssignee" label="指定谁填写产值比例">
          <a-select
            v-model:value="newFormState.nextAssignee"
            show-search
            :options="state.candidates"
            :filterOption="filterOption"
          />
        </a-form-item>
        <a-form-item name="file" label="上传附件">
          <a-upload
            :file-list="newFormState.fileList"
            :remove="handleRemove"
            :before-upload="beforeUpload"
            @change="fileUploadChange"
          >
            <a-button>
              <upload-outlined></upload-outlined>
              点击上传附件
            </a-button>
          </a-upload>
        </a-form-item>
        <a-button style="margin-left: 10px" @click="resetProjectForm"
          >重置数据</a-button
        >
      </a-form>
    </Modal>

    <Modal
      title="查看附件原图"
      v-model:visible="showPreview"
      width="1200"
      :footer="null"
    >
      <img :src="state.previewURL" style="max-width: 1100px" />
    </Modal>
  </div>
</template>
<script lang="ts">
import {
  defineComponent,
  ref,
  reactive,
  onMounted,
  UnwrapRef,
  toRaw,
  watchEffect,
} from "vue";
import {
  RuleObject,
  ValidateErrorEntity,
} from "ant-design-vue/es/form/interface";
import { UploadOutlined } from "@ant-design/icons-vue";
import { SelectTypes } from "ant-design-vue/es/select";
import aIcon from "@/components/aicon/aicon.vue";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons-vue";
import Modal from "@/components/tableLayout/modal.vue";
import { message, Modal as antModal } from "ant-design-vue";
import {
  getR2AllList,
  getAllR1R2R3Users,
  fillOutputValue,
  checkHistoryRequest,
  rollbackRequest,
  startProcess,
  generateNewProject,
} from "@/api/display";
import { typeMap, TYPE_OPTIONS } from "@/utils/config";
import moment from "moment";
import localStorageStore from "@/utils/localStorageStore";

interface filterFormState {
  name: string;
  number: string;
  type: string;
  year: string;
}

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
    title: "上传任务时间",
    slots: { customRender: "updatedAt" },
    key: "updatedAt",
  },
  {
    title: "项目长",
    dataIndex: "ownerName",
    key: "ownerName",
  },
  {
    title: "附件(点击可放大)",
    slots: { customRender: "attachment" },
    key: "attachment",
  },
  {
    title: "操作",
    key: "action",
    slots: { customRender: "action" },
  },
];

interface Member {
  userId: string;
  displayName: string;
}

interface PeopleAndProductRecord {
  peopleLabel: string;
  peopleValue: string;
  productLabel: string;
  productValue: number;
}

interface CommentForm {
  comment: string | undefined;
}

interface newFormState {
  name: string;
  number: string;
  type: string;
  fileList: [];
  taskId: string;
  processId: string;
  nextAssignee: string;
}

interface FileItem {
  uid: string;
  name?: string;
  status?: string;
  response?: Response;
  url: string;
}

interface FileInfo {
  file: FileItem;
  fileList: FileItem[];
}
export default defineComponent({
  name: "issue",
  components: {
    aIcon,
    Modal,
    PlusOutlined,
    MinusCircleOutlined,
    UploadOutlined,
  },
  data() {
    return {
      columns,
      typeMap,
    };
  },

  setup(props, context) {
    const addModal = ref();
    const visible = ref<boolean>(false);
    const confirmLoading = ref<boolean>(false);
    const showHistory = ref<boolean>(false);
    const historyLoading = ref<boolean>(false);
    const showRollback = ref<boolean>(false);
    const confirmLoading2 = ref<boolean>(false);
    const showNewProject = ref<boolean>(false);
    const showPreview = ref<boolean>(false);
    const formRef3 = ref();
    const tableLoading = ref<boolean>(false);
    const state = reactive({
      taskList: [],
      candidates: [],
      userIdToNameMap: {},
      processId: "",
      taskId: "",
      historyData: [],
      currentRollbackRecord: {},
      newProcessId: "",
      newTaskId: "",
      previewURL: "",
    });
    const commentForm: UnwrapRef<CommentForm> = reactive({
      comment: "",
    });

    const createNewFormState = () => ({
      name: "",
      number: "",
      type: "",
      fileList: [],
      taskId: "",
      processId: "",
      nextAssignee: "",
    });

    const newFormState: UnwrapRef<newFormState> = reactive(
      createNewFormState()
    );
    const formRef = ref();
    const dynamicForm: UnwrapRef<{
      records: PeopleAndProductRecord[];
    }> = reactive({
      records: [
        {
          peopleLabel: "项目成员",
          peopleValue: "",
          productLabel: "建议产值比例",
          productValue: 100,
        },
      ],
    });

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

    const typeOptions = TYPE_OPTIONS;
    console.log("typeOptions");
    console.dir(typeOptions);

    const fetchData = async (
      name: string,
      number: string,
      type: string,
      year: string
    ) => {
      const data = await getR2AllList(name, number, type, year).then(
        (response) => {
          tableLoading.value = false;
          return response.data.data;
        }
      );

      if (data.hasOwnProperty("empty") || data.finished.length === 0) {
        state.taskList = [];
      }

      state.taskList = data.unfinished;
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
      fetchData("", "", "", "2022");
    });

    // 点击表单添加按钮
    const addAdvice = (processId: string, taskId: string) => {
      visible.value = true;
      state.processId = processId;
      state.taskId = taskId;
      dynamicForm.records = localStorageStore.getCache(processId) || [
        {
          peopleLabel: "项目成员",
          peopleValue: "",
          productLabel: "建议产值比例",
          productValue: 100,
        },
      ];
    };

    const addSubmit = (e: MouseEvent) => {
      visible.value = false;
    };

    const checkForDuplicates = (array) => {
      return new Set(array).size !== array.length;
    };

    const onSubmitForm = () => {
      // visible.value = false;
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
          element.productValue < 0 ||
          element.productValue > 100 ||
          !Number.isInteger(element.productValue)
        ) {
          isError += 1;
          message.error("产值比例建议填写错误,需要为0到100的正整数");

          return;
        } else {
          sum += element.productValue;
        }
      });

      if (sum !== 100) {
        console.log(sum);
        isError += 1;
        message.error("所有成员的产值比例之和必须刚好是100");
        return;
      }

      if (isError === 0) {
        message.success("填写成功，正在上传数据中");
        // TODO 构造参数 发送请求
        confirmLoading.value = true;

        let params = buildParam(
          toRaw(state.candidates),
          records,
          state.processId,
          state.taskId
        );

        fillOutputValue(params)
          .then((response) => {
            // 删除本地缓存
            localStorageStore.deleteCache(state.processId);
            confirmLoading.value = false;
            if (response.data.status === "ok") {
              visible.value = false;
              message.success("数据上传成功");
              fetchData("", "", "", "2022");
            } else {
              message.error("程序异常");
            }
          })
          .catch((err) => {
            confirmLoading.value = false;
            message.error("程序异常");
          });
      }
      console.log("submit!", toRaw(dynamicForm));
    };

    const buildParam = (candidates, records, processId, taskId) => {
      const param = {};
      param["processId"] = processId;
      param["taskId"] = taskId;

      const data = records.map((item) => {
        let temp = {};
        temp["userId"] = "" + item.peopleValue;
        temp["percentage"] = "" + item.productValue;
        temp["displayName"] = toRaw(state.userIdToNameMap)[item.peopleValue];
        return temp;
      });
      param["data"] = JSON.stringify(data);
      return param;
    };

    const onCancel = () => {
      visible.value = false;
    };

    const filterOption = (input: string, option: any) => {
      return option.label.indexOf(input) >= 0;
    };

    const addRecord = () => {
      dynamicForm.records.push({
        peopleLabel: "项目成员",
        peopleValue: "",
        productLabel: "建议产值比例",
        productValue: 100,
      });
    };

    const removeRecord = (item: PeopleAndProductRecord) => {
      let index = dynamicForm.records.indexOf(item);
      if (index !== -1) {
        dynamicForm.records.splice(index, 1);
      }
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

    const rollback = (record) => {
      // 打开Modal
      showRollback.value = true;
      // 拼接参数
      const tmp = {};
      tmp["processId"] = record.processId;
      tmp["taskId"] = record.taskId;
      tmp["targetKey"] = "uploadTask";
      tmp["comment"] = "";
      // 存数据到state
      state.currentRollbackRecord = tmp;
    };

    const rollbackOk = () => {
      //获取填写的comment值
      const newComment = toRaw(commentForm).comment;
      state.currentRollbackRecord["comment"] = newComment;
      // send request
      console.log("传参");
      console.dir(toRaw(state.currentRollbackRecord));
      confirmLoading2.value = true;
      rollbackRequest(toRaw(state.currentRollbackRecord))
        .then((response) => {
          message.success("退回成功");
          confirmLoading2.value = false;
          fetchData("", "", "", "2022");

          showRollback.value = false;
        })
        .catch((err) => {
          console.log(err);
          confirmLoading2.value = false;
          message.error("程序异常");
        });
    };

    const reuploadProjects = (processId, taskId) => {
      showNewProject.value = true;
      state.newProcessId = processId;
      state.newTaskId = taskId;
    };

    const createNewProject = () => {
      showNewProject.value = true;
      startProcess()
        .then((response) => {
          const data = response.data.data;
          state.newProcessId = data.processId;
          state.newTaskId = data["taskId"];
        })
        .catch((err) => {
          console.log(err);
          message.error("创建流程失败");
        });
    };

    const createProjectOk = () => {
      console.log("表单数据");
      console.dir(formRef3.value);
      const formData = toRaw(newFormState);
      console.dir(formData);
      formRef3.value
        .validate()
        .then(() => {
          if (formData["nextAssignee"] === "") {
            message.error("必须指定用户填写产值比例");
            return;
          }

          // 附件不能为空
          if (formData["fileList"].length === 0) {
            message.error("必须上传附件");
            return;
          }
          showNewProject.value = false;

          const params = {};
          params["processId"] = state.newProcessId;
          params["taskId"] = state.newTaskId;
          params["nextAssignee"] = formData.nextAssignee;
          params["name"] = formData.name;
          params["number"] = formData.number;
          params["type"] = formData.type;
          params["file"] =
            formData["fileList"].length > 0
              ? formData["fileList"][0].originFileObj
              : null;
          console.log("拼接参数");
          console.dir(params);

          generateNewProject(params)
            .then(() => {
              message.success("创建项目成功");

              state.newProcessId = "";
              state.newTaskId = "";

              // 清空表单数据
              Object.assign(newFormState, createNewFormState());

              fetchData("", "", "", "2022");
            })
            .catch((err) => {
              console.log(err);
              message.error("创建项目失败");
            });
        })
        .catch((error) => {
          console.log("error", error);
        });
    };

    const handleRemove = (file) => {
      const index = newFormState.fileList.indexOf(file);
      const newFileList = newFormState.fileList.slice();
      newFileList.splice(index, 1);
      newFormState.fileList = newFileList;
    };

    const beforeUpload = (file) => {
      console.log("newFormState.fileList");
      console.dir(newFormState.fileList);
      newFormState.fileList = [...newFormState.fileList, file];
      return false;
    };

    const fileUploadChange = (param) => {
      const changedFileList = param.fileList.slice(-1);
      newFormState.fileList = changedFileList;
    };

    const projectRules = {
      name: [{ required: true, message: "请填写项目名称", trigger: "blur" }],
      number: [
        { required: true, message: "请填写任务书编号", trigger: "blur" },
      ],
      type: [{ required: true, message: "请选择项目类型", trigger: "change" }],
      // nextAssignee: [
      //   {
      //     required: true,
      //     message: "请指定由谁填写产值比例",
      //     trigger: "change",
      //   },
      // ],
    };

    const resetProjectForm = () => {
      formRef3.value.resetFields();
    };

    const changeTime = (time) => {
      return moment(time).add(8, "hours").format("lll");
    };

    const showImg = (srcURL) => {
      showPreview.value = true;
      state.previewURL = srcURL;
    };

    const handleCancel = () => {
      localStorageStore.setCache(state.processId, dynamicForm.records);
      visible.value = false;
    };

    const createFilterFormState = () => ({
      name: "",
      number: "",
      type: "",
      year: "2022",
    });
    const typeOptions2 = TYPE_OPTIONS;

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
        fetchData(...values);
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

    return {
      labelCol: { style: { width: "150px", textAlign: "center" } },
      state,
      confirmLoading,
      visible,
      addModal,
      addAdvice,
      addSubmit,
      onSubmitForm,
      filterOption,
      onCancel,
      dynamicForm,
      addRecord,
      removeRecord,
      // rules,
      formRef,
      checkHistory,
      historyOk,
      showHistory,
      historyLoading,
      historyColumns,
      rollback,
      showRollback,
      rollbackOk,
      commentForm,
      confirmLoading2,
      showNewProject,
      createNewProject,
      createProjectOk,
      newFormState,
      typeOptions,
      handleRemove,
      beforeUpload,
      fileUploadChange,
      projectRules,
      formRef3,
      resetProjectForm,
      reuploadProjects,
      changeTime,
      showPreview,
      showImg,
      handleCancel,

      filterFormState,
      tableLoading,
      searchFilters,
      typeOptions2,
      wrapperCol: { span: 14, offset: 4 },
      options1,
    };
  },
});
</script>
<style lang="scss" scoped>
.issue__container {
  padding: 20px;
  font-size: 14px;
  & .icons {
    display: flex;
    margin: 0;
    padding: 0;
    & li {
      margin-right: 10px;
      list-style: none;
      font-size: 24px;
      cursor: pointer;
    }
  }
}
.line-wrapper {
  display: flex;
  justify-content: center;
}

.add-record-button {
  width: 100%;
}

.table-wrapper {
  margin-top: 30px;
}

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
</style>
