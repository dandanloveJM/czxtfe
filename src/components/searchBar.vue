<template>
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
      />
    </a-form-item>
    <a-form-item name="number" label="项目编号">
      <a-input v-model:value="filterFormState.number" />
    </a-form-item>
    <a-form-item name="year" label="按年度筛选">
      <a-select
        ref="year1"
        v-model:value="filterFormState.year"
        style="width: 120px"
        :options="options1"
      />
    </a-form-item>
    <a-form-item :wrapper-col="wrapperCol">
      <a-button type="primary" @click="sendData">搜索</a-button>
    </a-form-item>
  </a-form>
</template>
<script lang="ts">
import { TYPE_OPTIONS } from "@/utils/config";
import {
  defineComponent,
  ref,
  reactive,
  UnwrapRef,
} from "vue";
import  SelectTypes  from "ant-design-vue/es/select";

interface filterFormState {
  name: string;
  number: string;
  type: string;
  year: string;
}

export default defineComponent({
  name: "aicon",
  props: {
    searchFilters: {
      required: true,
      type: Function,
    },
  },
  setup(props, context) {
    const createFilterFormState = () => ({
      name: "",
      number: "",
      type: "",
      year: "2022",
    });
    const typeOptions = TYPE_OPTIONS;
    const filterOption = (input: string, option: any) => {
      return option.label.indexOf(input) >= 0;
    };
    const filterFormState: UnwrapRef<filterFormState> = reactive(
      createFilterFormState()
    );
    const sendData = () => {
      props.searchFilters();
    };
    const options1 = ref<typeof SelectTypes["options"]>([
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
      typeOptions,
      filterOption,
      filterFormState,
      sendData,
      wrapperCol: { span: 14, offset: 4 },
      options1,
    };
  },
});
</script>
<style lang="scss" scoped></style>
