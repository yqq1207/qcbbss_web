import { getAllMenu, getPageMenuTree } from '../../services/role/services';

export default {
  namespace: 'menus',

  state: {
    data: {
      list: [],
      pagination: {
        current: 0,
        pageSize: 0,
        total: 0,
      },
    },
    menuTree: {
      data: [],
    },
  },

  effects: {
    *fetchList({ payload }, { call, put }) {
      const response = yield call(getAllMenu, payload);
      if (!response) return;
      yield put({
        type: 'saveList',
        payload: response,
      });
    },
    *fetchPageMenuTree({ payload, callback }, { call, put }) {
      const response = yield call(getPageMenuTree, payload);
      if (!response) return;
      yield put({
        type: 'savePageMenuTree',
        payload: response,
      });
      if (callback) callback(response);
    },
  },

  reducers: {
    saveList(state, action) {
      return {
        ...state,
        data: {
          list: action.payload.data.rows,
          pagination: {
            current: action.payload.data.pageNumber,
            pageSize: action.payload.data.pageSize,
            total: action.payload.data.total,
            pageSizeOptions: ['100', '20', '30', '40'],
            showSizeChanger: true,
            showQuickJumper: true,
          },
        },
      };
    },
    savePageMenuTree(state, action) {
      let { data } = action.payload;
      if (JSON.stringify(data) === '{}') data = [];
      return {
        ...state,
        menuTree: {
          data,
        },
      };
    },
  },
};
