<template>
  <div class="issue__container">
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
          <a-space>
            日期筛选：
            <a-range-picker
              v-model:value="filterFormState.range"
              @change="onChangeRangePicker"
            />
          </a-space>
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
          :customRow="customRow"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'updatedAt'">
              <span>{{ changeTime(record.updatedAt) }}</span>
            </template>

            <template v-else-if="column.dataIndex === 'name'">
              <span
                v-if="(record.pmId === userId && record.step2New) || record.step3New"
                class="new-project-name"
                >{{ record.name }}
                <icon>
                  <template #component>
                    <svg
                      t="1656949715400"
                      class="icon"
                      viewBox="0 0 1024 1024"
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      p-id="2725"
                      width="2em"
                      height="2em"
                      fill="currentColor"
                    >
                      <path
                        d="M508.330667 733.994667c-11.008-7.338667-13.44-17.109333-7.338667-29.333334 28.117333-37.888 41.557333-98.986667 40.341333-183.317333v-165.013333c0-14.656 7.338667-23.210667 21.994667-25.664 37.888-1.216 82.496-5.504 133.845333-12.842667 13.44-2.432 21.376 3.072 23.829334 16.512 1.216 12.224-4.266667 19.562667-16.512 21.994667a1787.093333 1787.093333 0 0 1-113.664 11.008c-6.101333 0-9.173333 3.669333-9.173334 10.986666v84.330667h135.68c12.224 1.237333 18.944 7.957333 20.16 20.181333-1.216 10.986667-7.936 17.109333-20.16 18.346667h-36.672v223.658667c-1.216 12.202667-7.936 18.944-20.16 20.16-11.008-1.216-17.109333-7.957333-18.346666-20.16V501.162667h-60.48v18.346666c1.216 92.885333-13.44 161.92-44.010667 207.146667-6.101333 12.224-15.893333 14.677333-29.333333 7.338667z m-131.989334-282.325334c-1.237333 0-2.453333 0.618667-3.669333 1.834667h45.824a522.666667 522.666667 0 0 0 16.512-31.168c7.317333-12.224 12.224-20.778667 14.656-25.664 6.122667-11.008 15.274667-14.677333 27.52-11.008 9.770667 6.122667 12.202667 14.058667 7.317333 23.829333-4.906667 9.792-13.44 24.448-25.664 44.010667h49.493334c9.770667 1.216 15.274667 6.72 16.512 16.490667-1.237333 11.008-6.741333 17.109333-16.512 18.346666h-82.496a12.437333 12.437333 0 0 1 3.669333 9.173334v38.485333h69.653333c9.792 1.216 15.296 6.72 16.512 16.490667-1.216 11.008-6.72 17.130667-16.512 18.346666h-69.653333v108.16c0 34.218667-15.274667 51.946667-45.845333 53.162667h-16.490667a195.157333 195.157333 0 0 1-20.16 1.834667c-12.224 0-19.562667-6.72-22.016-20.16 1.237333-12.224 7.338667-18.944 18.346667-20.16 2.432 0 6.101333 0.597333 10.986666 1.834666h11.008c15.893333 0 23.829333-8.554667 23.829334-25.685333v-98.986667H314.026667c-11.008-1.216-17.109333-7.338667-18.346667-18.346666 1.237333-9.770667 7.338667-15.274667 18.346667-16.490667h75.157333V497.493333c0-3.669333 1.216-6.72 3.669333-9.173333h-89.813333c-11.029333-1.216-17.130667-7.317333-18.346667-18.325333 1.216-9.770667 7.317333-15.274667 18.346667-16.490667h56.810667c-3.669333-1.216-6.72-4.266667-9.173334-9.173333-1.216-1.216-3.050667-4.266667-5.482666-9.173334a758.336 758.336 0 0 0-14.677334-23.829333c-4.885333-9.770667-3.050667-17.706667 5.504-23.829333 11.008-3.669333 19.562667-1.216 25.664 7.338666 2.453333 2.432 6.122667 7.338667 11.008 14.656 6.101333 8.554667 9.770667 14.08 10.986667 16.512 4.906667 9.770667 2.453333 18.346667-7.317333 25.664z m-60.501333-71.509333c-9.792-1.216-15.274667-7.317333-16.512-18.346667 1.237333-9.749333 6.72-15.253333 16.512-16.490666h75.157333c-3.669333-12.202667-7.338667-21.973333-10.986666-29.333334-1.237333-12.202667 3.648-19.541333 14.656-21.973333 12.224-2.453333 21.397333 1.216 27.52 10.986667 0 1.216 0.597333 3.669333 1.813333 7.338666 4.906667 15.872 9.173333 26.88 12.842667 32.981334h60.48c11.008 1.237333 17.130667 6.741333 18.346666 16.512-1.216 11.008-7.338667 17.109333-18.346666 18.346666h-181.482667z m-14.677333 311.68c-8.533333-6.122667-10.986667-14.08-7.338667-23.829333a1659.648 1659.648 0 0 0 33.002667-66.005334c4.906667-9.792 12.224-12.842667 22.016-9.173333 9.770667 4.906667 13.44 12.224 10.986666 21.994667-3.669333 6.122667-9.173333 17.728-16.490666 34.837333-8.554667 15.893333-14.677333 27.52-18.346667 34.837333-4.885333 8.554667-12.821333 11.008-23.829333 7.338667z m201.664-25.664c-9.770667 4.885333-18.346667 2.432-25.664-7.338667a1138.56 1138.56 0 0 1-27.498667-44.010666c-4.885333-8.533333-3.050667-16.490667 5.504-23.829334 9.770667-3.669333 18.346667-1.216 25.664 7.338667l14.677333 21.994667c6.101333 9.770667 10.389333 17.109333 12.821334 21.994666 4.906667 8.554667 3.050667 16.512-5.504 23.850667z"
                        fill="#ea3323"
                        p-id="2726"
                      ></path>
                      <path
                        d="M675.328 117.717333A425.429333 425.429333 0 0 0 512 85.333333C276.352 85.333333 85.333333 276.352 85.333333 512s191.018667 426.666667 426.666667 426.666667 426.666667-191.018667 426.666667-426.666667c0-56.746667-11.093333-112-32.384-163.328a21.333333 21.333333 0 0 0-39.402667 16.341333A382.762667 382.762667 0 0 1 896 512c0 212.074667-171.925333 384-384 384S128 724.074667 128 512 299.925333 128 512 128c51.114667 0 100.8 9.984 146.986667 29.12a21.333333 21.333333 0 0 0 16.341333-39.402667z"
                        fill="#ea3323"
                        p-id="2727"
                      ></path>
                    </svg>
                  </template>
                </icon>
              </span>
              <span v-else>{{ record.name }}</span>
            </template>

            <template v-else-if="column.dataIndex === 'check'">
              <span v-if="record.activityName === 'R3审核'">
                <a-tag color="warning">
                  <template #icon>
                    <exclamation-circle-outlined />
                  </template>
                  待审核
                </a-tag>
              </span>
              <span v-else-if="record.activityName === 'R2/R1填写产值分配建议'">
                <a-tag color="blue">
                  <template #icon>
                    <exclamation-circle-outlined />
                  </template>
                  待分配产值
                </a-tag>
              </span>
              <span v-else>
                <a-tag color="success">
                  <template #icon>
                    <check-circle-outlined />
                  </template>
                  已审核
                </a-tag>
              </span>
            </template>

            <template v-else-if="column.dataIndex === 'action'">
              <span
                v-if="
                  record.activityName === 'R2/R1填写产值分配建议' &&
                  record.pmId === userId
                "
              >
                <a-button @click="() => addAdvice(record.processId, record.taskId)"
                  >产值分配</a-button
                >
                <a-divider type="vertical" />
              </span>

              <span v-if="record.activityName === 'R3审核'">
                <a-button @click="() => check(record)">点击审核</a-button>
                <a-divider type="vertical" />
              </span>

              <span>
                <a-button @click="() => checkHistory(record.processId)">
                  流程查看
                </a-button>
              </span>
            </template>

            <template v-else-if="column.dataIndex === 'number'">
              <span
                :class="
                  ((record.pmId === userId && record.step2New) || record.step3New)
                    ? 'new-project-name'
                    : ''
                "
                >{{ record.number }}</span
              >
            </template>

            <template v-else-if="column.dataIndex === 'type'">
              <span
                :class="
                  ((record.pmId === userId && record.step2New) || record.step3New)
                    ? 'new-project-name'
                    : ''
                "
                >{{ typeMap[record.type] }}</span
              >
            </template>
            <template v-else-if="column.dataIndex === 'attachment'">
              <a-button @click="() => showImg(record.attachment)">查看任务书</a-button>
            </template>
          </template>
        </a-table>
      </div>
      <div class="emptyTable" v-else>
        <a-empty />
      </div>
    </div>

    <div v-drag-modal>
      <a-modal
        title="查看附件原图"
        v-model:visible="showPreview"
        width="1200px"
        :footer="null"
        :destroyOnClose="true"
      >
        <img :src="state.previewURL" style="max-width: 1100px" />
      </a-modal>
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
        :maskClosable="false"
      >
        <template #footer>
          <a-button key="back" @click="handleCancel">暂存并关闭</a-button>
          <a-button
            key="submit"
            type="primary"
            :loading="confirmLoading"
            @click="onSubmitForm"
            >确认并发送</a-button
          >
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
                :max="100"
                :min="0"
              />
            </a-form-item>
            <a-button
              danger
              v-if="dynamicForm.records.length > 1"
              class="dynamic-delete-button"
              :disabled="dynamicForm.records.length === 1"
              @click="removeRecord(record)"
              >删除</a-button
            >
          </div>
          <div class="product_sum_calculator">
            <div style="min-width: 45%"></div>
            <div style="min-width: 35%">
              <CalculatorTwoTone />
              当前产值比例总和: {{ adviceProductSum }}
            </div>
          </div>
          <a-form-item>
            <a-button
              type="dashed"
              class="add-record-button"
              @click="addRecord"
              size="large"
            >
              <PlusOutlined />点击增加项目成员
            </a-button>
          </a-form-item>
        </a-form>
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
            <span>{{
              record.comment ? record.comment : record.endTime ? "【通过】" : "【进行中】"
            }}</span>
          </template>
        </a-table>
      </a-modal>
    </div>

    <div v-drag-modal>
      <a-modal
        title="审核流程"
        v-model:visible="showCheck"
        width="1200px"
        :destroyOnClose="true"
        :footer="null"
      >
        <a-tabs v-model:activeKey="activeKey">
          <a-tab-pane key="1">
            <template #tab>
              <span class="tab-title-header"> <AppstoreTwoTone />项目详情 </span>
            </template>
            <a-table
              :columns="columnsWithoutOperation"
              :data-source="[state.checkRecord]"
              :rowKey="(record) => record.processId"
              :pagination="false"
            >
              <template #updatedAt="{ record }">
                <span>{{ changeTime(record.updatedAt) }}</span>
              </template>

              <template #type="{ record }">
                <span>{{ typeMap[record.type] }}</span>
              </template>
              <template #attachment="{ record }">
                <a-button @click="() => showImg(record.attachment)">查看任务书</a-button>
              </template>
            </a-table>
          </a-tab-pane>
          <a-tab-pane key="2">
            <template #tab>
              <span class="tab-title-header"> <CrownTwoTone />产值比例 </span>
            </template>
            <a-table
              :columns="productColumns"
              :data-source="state.products"
              :rowKey="(record) => record.id"
              :pagination="true"
            >
              <template #percentage="{ record }">
                <span>{{ record.percentage + "%" }}</span>
              </template>
            </a-table>
          </a-tab-pane>
        </a-tabs>

        <header class="header-title-wrapper header-title-wrapper-with-margin-top">
          <EditTwoTone />
          <span class="header-title">流程审批</span>
        </header>

        <a-form ref="formRef2" :model="commentForm">
          <div class="check-form-label">
            <a-form-item name="comment" label="审批意见" class="label-style">
              <a-input v-model:value="commentForm.comment" />
            </a-form-item>
          </div>
        </a-form>

        <div class="button-wrapper">
          <div class="reject-button">
            <a-button danger size="large" @click="() => rollbackTo('fillNumbers')"
              >退回，重新填写产值比例</a-button
            >
            <a-button danger size="large" @click="() => rollbackTo('uploadTask')"
              >退回，重新上传任务</a-button
            >
          </div>
          <div class="agree">
            <a-button @click="() => agreeTo()" type="primary" size="large"
              >审核通过</a-button
            >
          </div>
        </div>
      </a-modal>
    </div>
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
  computed,
  h,
} from "vue";
import { UploadOutlined } from "@ant-design/icons-vue";
import SelectTypes from "ant-design-vue/es/select";
import aIcon from "@/components/aicon/aicon.vue";
import Icon, {
  MinusCircleOutlined,
  PlusOutlined,
  AppstoreTwoTone,
  CrownTwoTone,
  EditTwoTone,
  CalculatorTwoTone,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons-vue";
import Modal from "@/components/tableLayout/modal.vue";
import { message } from "ant-design-vue";
import {
  getR3UnfinishedList,
  getAllR1R2R3Users,
  fillOutputValue,
  checkHistoryRequest,
  rollbackRequest,
  r3Approve,
  updateIsNewProject,
} from "@/api/display";
import { typeMap, TYPE_OPTIONS } from "@/utils/config";
// import moment from "moment";
import dayjs from "dayjs";
import localStorageStore from "@/utils/localStorageStore";
import localCache from "@/utils/localCache";
import type { Dayjs } from "dayjs";
import { debounce } from "lodash-es";

interface filterFormState {
  name: string;
  number: string;
  type: string;
  year: string;
  startDate: string;
  endDate: string;
  range: Dayjs;
}

const filterDict = {
  待审核: ["R3审核"],
  已审核: ["R4审核", "A1填写产值"],
  待分配产值: ["R2/R1填写产值分配建议"],
};
const vnode = h("div", {
  class: "bar",
  innerHTML: "点击筛选状态",
  style: { color: "#4748ed" },
});
const columns = [
  {
    title: "任务名",
    dataIndex: "name",
    key: "name",
    width: 250,
  },
  {
    title: "任务书编号",
    dataIndex: "number",
    key: "number",
  },
  {
    title: "任务类型",
    dataIndex: "type",
    key: "type",
  },
  {
    title: "上传任务时间",
    dataIndex: "updatedAt",
    key: "updatedAt",
  },
  {
    title: "项目长",
    dataIndex: "ownerName",
    key: "ownerName",
  },
  {
    title: "附件",
    dataIndex: "attachment",
    key: "attachment",
  },
  {
    title: "状态",
    key: "check",
    dataIndex: "check",
    filters: [
      {
        text: "已审核",
        value: "已审核",
      },
      {
        text: "待审核",
        value: "待审核",
      },
      {
        text: "待分配产值",
        value: "待分配产值",
      },
    ],
    filterMultiple: false,
    filterIcon: vnode,
    onFilter: (value: string, record) => {
      console.log("-----filter");
      console.log(filterDict[value]);
      console.log(record.activityName);
      console.log(filterDict[value].indexOf(record.activityName) === 0);
      return filterDict[value].indexOf(record.activityName) >= 0;
      // if (record.activityName === 'R3审核') {
      //   return value === "待审核"
      // } else if (record.activityName === 'R2/R1填写产值分配建议') {
      //   return value === '待分配产值'
      // }
      // else {
      //   return value === "已审核"
      // }
    },
  },
  {
    title: "操作",
    key: "action",
    dataIndex: "action",
  },
];

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

export default defineComponent({
  name: "issue",
  components: {
    aIcon,
    Modal,
    Icon,
    PlusOutlined,
    MinusCircleOutlined,
    UploadOutlined,
    CrownTwoTone,
    AppstoreTwoTone,
    EditTwoTone,
    CalculatorTwoTone,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
  },
  data() {
    return {
      columns,
      typeMap,
    };
  },

  setup() {
    const addModal = ref();
    const userId = localCache.getCache("setInfo")["id"];
    const visible = ref<boolean>(false);
    const confirmLoading = ref<boolean>(false);
    const showHistory = ref<boolean>(false);
    const historyLoading = ref<boolean>(false);
    const showRollback = ref<boolean>(false);
    const confirmLoading2 = ref<boolean>(false);
    const showNewProject = ref<boolean>(false);
    const showPreview = ref<boolean>(false);
    const showCheck = ref<boolean>(false);
    const tableLoading = ref<boolean>(false);
    const state = reactive({
      taskList: [],
      candidates: [],
      userIdToNameMap: {},
      processId: "",
      taskId: "",
      historyData: [],
      currentRollbackRecord: {},
      checkRecord: {},
      checkProcessId: "",
      checkTaskId: "",
      products: [],
      previewURL: "",
    });
    const commentForm: UnwrapRef<CommentForm> = reactive({
      comment: "",
    });

    const newFormState: UnwrapRef<newFormState> = reactive({
      name: "",
      number: "",
      type: "",
      fileList: [],
      taskId: "",
      processId: "",
      nextAssignee: "",
    });
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
        title: "开始时间",
        dataIndex: "startTime",
        key: "startTime",
      },
      {
        title: "结束时间",
        dataIndex: "endTime",
        key: "endTime",
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

    const columnsWithoutOperation = [
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
        title: "附件",
        slots: { customRender: "attachment" },
        key: "attachment",
      },
    ];

    const typeOptions = TYPE_OPTIONS;

    console.log("typeOptions");
    console.dir(typeOptions);

    const fetchData = async (
      name: string,
      number: string,
      type: string,
      year: string,
      startDate: string,
      endDate: string
    ) => {
      const data = await getR3UnfinishedList(
        name,
        number,
        type,
        year,
        startDate,
        endDate
      ).then((response) => {
        tableLoading.value = false;
        return response.data.data;
      });
      state.taskList = data;
    };

    const fetchCandidates = async () => {
      const candidates = await getAllR1R2R3Users().then((response) => response.data.data);
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
      fetchData("", "", "", "" + dayjs().year(), "", "");
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

    const addSubmit = () => {
      visible.value = false;
    };

    const checkForDuplicates = (array) => {
      return new Set(array).size !== array.length;
    };

    const onSubmitForm = debounce(() => {
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
      }
);

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
            confirmLoading.value = false;
            //  删除缓存
            localStorageStore.deleteCache(state.processId);
            if (response.data.status === "ok") {
              visible.value = false;
              message.success("数据上传成功");
              fetchData("", "", "", "" + dayjs().year(), "", "");
            } else {
              message.error(response.data.msg);
            }
          })
          .catch(() => {
            confirmLoading.value = false;
            message.error("程序异常");
          });
      }
      console.log("submit!", toRaw(dynamicForm));
    }, 3000, {
        leading: true,
        trailing: false,
      }
);

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
        .catch(() => {
          message.error("程序异常");
        });
    };

    const historyOk = () => {
      showHistory.value = false;
      state.historyData = [];
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
        .then(() => {
          message.success("退回成功");
          confirmLoading2.value = false;
          fetchData("", "", "", "" + dayjs().year(), "", "");

          showRollback.value = false;
        })
        .catch((err) => {
          console.log(err);
          confirmLoading2.value = false;
          message.error("程序异常");
        });
    };

    const check = (record) => {
      showCheck.value = true;

      state.products = record.products;
      state.checkRecord = record;
      state.checkProcessId = record.processId;
      state.checkTaskId = record.taskId;
    };

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
    ];

    const rollbackTo = debounce((targetKey) => {
      const params = {};
      params["processId"] = state.checkProcessId;
      params["taskId"] = state.checkTaskId;
      params["targetKey"] = targetKey;
      params["comment"] = toRaw(commentForm).comment || "";

      commentForm.comment = "";

      rollbackRequest(params)
        .then(() => {
          message.success("退回成功");
          fetchData("", "", "", "" + dayjs().year(), "", "");

          showCheck.value = false;
          state.checkProcessId = "";
          state.checkTaskId = "";
        })
        .catch((err) => {
          console.log(err);
          message.error("程序异常");
        });
    }, 3000, {
        leading: true,
        trailing: false,
      }
);

    const agreeTo = debounce(() => {
      const params = {};
      params["processId"] = state.checkProcessId;
      params["taskId"] = state.checkTaskId;
      params["comment"] = toRaw(commentForm).comment || "";

      console.log("参数");
      console.log(params);

      r3Approve(params)
        .then(() => {
          message.success("审核通过成功");
          fetchData("", "", "", "" + dayjs().year(), "", "");

          showCheck.value = false;
          state.checkProcessId = "";
          state.checkTaskId = "";
          commentForm.comment = "";
        })
        .catch((err) => {
          console.log(err);
          message.error("程序异常");
        });
    }, 3000, {
        leading: true,
        trailing: false,
      }
);
    const changeTime = (time) => {
      return dayjs(time).add(8, "hours").format("YYYY年MM月DD日 HH:mm");
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
      startDate: "",
      endDate: "",
      range: null,
    });

    const filterFormState: UnwrapRef<filterFormState> = reactive(createFilterFormState());

    const searchFilters = () => {
      // 拿到filterFormState数据，拼接参数, 发送fetchData请求, 设置loading
      const formData = toRaw(filterFormState);
      const values = Object.values(formData);

      tableLoading.value = true;
      fetchData(
        formData.name,
        formData.number,
        formData.type,
        formData.year,
        formData.startDate,
        formData.endDate
      );
    };

    const options1 = ref<typeof SelectTypes["options"]>([
      {
        value: "" + (dayjs().year() - 1),
        label: "" + (dayjs().year() - 1),
      },
      {
        value: "" + dayjs().year(),
        label: "" + dayjs().year(),
      },
      {
        value: "" + (dayjs().year() + 1),
        label: "" + (dayjs().year() + 1),
      },

      {
        value: "" + (dayjs().year() + 2),
        label: "" + (dayjs().year() + 2),
      },
    ]);

    const adviceProductSum = computed(() => {
      const value = dynamicForm.records.reduce((accumulator, currentItem) => {
        return accumulator + currentItem.productValue;
      }, 0);
      console.log("value22");
      console.log(value);
      return value;
    });

    const onChangeRangePicker = (value, dateString) => {
      filterFormState.startDate = dateString.slice(0, 1).toString();
      filterFormState.endDate = dateString.slice(1, 2).toString();
    };

    const customRow = (record) => {
      return {
        onClick: (event) => {
          console.log("click");
          if ((record.pmId == userId && !!record.step2New) || !!record.step3New) {
            if (!!record.step2New) {
              record.step2New = !record.step2New;
              updateIsNewProject(record.processId, false, null, null, null)
                .then((response) => {
                  // fetchData("", "", "", "" + dayjs().year(), "", "");
                })
                .catch((err) => {
                  message.error("系统错误");
                });
              console.dir(event);
            }
            if (!!record.step3New) {
              record.step3New = !record.step3New;
              updateIsNewProject(record.processId, null, false, null, null)
                .then((response) => {
                  // fetchData("", "", "", "" + dayjs().year(), "", "");
                })
                .catch((err) => {
                  message.error("系统错误");
                });
              console.dir(event);
            }
          }
        },
      };
    };

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
      showRollback,
      rollbackOk,
      commentForm,
      confirmLoading2,
      showNewProject,

      newFormState,
      typeOptions,
      showCheck,
      productColumns,
      check,
      rollbackTo,
      agreeTo,
      changeTime,
      showPreview,
      showImg,
      handleCancel,
      columnsWithoutOperation,
      activeKey: ref("1"),
      labelColOfCheck: { style: { fontSize: "18px" } },

      filterFormState,
      tableLoading,
      searchFilters,

      wrapperCol: { span: 14, offset: 4 },
      options1,
      adviceProductSum,
      userId,
      onChangeRangePicker,
      customRow,
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

.button-wrapper {
  margin-top: 30px;
  display: flex;
  justify-content: center;

  .reject-button .ant-btn {
    margin-right: 20px;
  }
}

.header-title-wrapper {
  font-size: 22px;
  margin-bottom: 10px;
  .header-title {
    margin-left: 10px;
  }
}

.header-title-wrapper-with-margin-top {
  margin-top: 20px;
}

.tab-title-header {
  font-size: 20px;
}
.label-wrapper {
  font-size: 18px;
}

.label-style > :first-child > label {
  font-size: 18px;
}

.check-form-label .label-style label {
  font-size: 18px;
}

.ant-form-item-label > label {
  font-size: 18px;
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
.product_sum_calculator {
  display: flex;
  justify-content: center;
  font-size: 18px;
}
.ant-table-cell {
  .new-project-name {
    font-weight: bold;
    display: flex;
  }
}
</style>
