import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { Form, Input, Button, Card, Tree } from 'antd';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';

const FormItem = Form.Item;
const { TextArea } = Input;
const { TreeNode } = Tree;

@connect(({ loading, menus, role, routing }) => ({
  submitting: loading.effects['role/add'] || loading.effects['role/update'],
  loading: loading.models.menu,
  menus,
  role,
  routing,
}))
@Form.create()
export default class RoleAdd extends PureComponent {
  state = {
    expandedKeys: [],
    autoExpandParent: true,
    checkedKeys: [],
    selectedKeys: [],
  };

  componentDidMount() {
    const that = this;
    const { dispatch, match: { params: { id } } } = this.props;
    if (id !== '0') {
      dispatch({
        type: 'menus/fetchPageMenuTree',
        payload: {},
        callback: (response) => {
          let { data } = response;
          if (!data) data = [];
          const parentsId = data.map(item => item.key);
          dispatch({
            type: 'role/fetchRoleDetail',
            payload: { id },
            callback: (res) => {
              let { data: { shopRolePage } } = res;
              if (!shopRolePage) shopRolePage = [];
              let checkedKeys = shopRolePage.map(item => item.pageId);
              checkedKeys = parentsId.map((item) => {
                const index = checkedKeys.indexOf(item);
                if (index >= 0) checkedKeys.splice(index, 1);
                return checkedKeys;
              });
              checkedKeys = Array.from(new Set(checkedKeys.reduce((a, b) => a.concat(b))));
              that.setState({
                checkedKeys,
              });
            },
          });
        },
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    const rows = nextProps.role.roleDetail.pages.map((e) => { return e.pageId; });
    this.handleSelectRows(rows);
  }

  onExpand = (expandedKeys) => {
    // if not set autoExpandParent to false, if children expanded, parent can not collapse.
    // or, you can remove all expanded children keys.
    this.setState({
      expandedKeys,
      autoExpandParent: false,
    });
  }

  onCheck = (checkedKeys) => {
    this.setState({ checkedKeys });
  }

  onSelect = (selectedKeys) => {
    this.setState({ selectedKeys });
  }


  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, values) => {
      const { checkedKeys } = this.state;
      if (!err) {
        const {
          dispatch,
          match: { params: { id } },
          role, menus: { menuTree: { data } },
        } = this.props;
        const parents = data.map(item => item.children).reduce((a, b) => a.concat(b));
        const parentId = checkedKeys.map((even) => {
          const checkedParents =
            parents.filter(item => parseInt(item.key, 0) === parseInt(even, 0));
          return checkedParents;
        }).reduce((a, b) => a.concat(b));
        const record = parentId.map(item => item.parentId);
        const records = parentId.map(item => item.key);
        const datas = Array.from(new Set(record.concat(records)));
        const rows = datas.map((item) => { return { id: item }; });
        const val = { ...values, adminPages: rows };
        if (id !== '0') {
          const { name, description } = val;
          const { isBoss, shopId } = role.roleDetail.role;
          const roleInfo = { id: role.roleDetail.role.id, name, description, shopId, isBoss };
          dispatch({
            type: 'role/update',
            payload: { role: roleInfo, adminPages: rows },
          });
        } else {
          dispatch({
            type: 'role/add',
            payload: val,
          });
        }
      }
    });
  }

  handleSelectRows = () => {

  }

  handleCancel = () => {
    const { dispatch } = this.props;
    dispatch(routerRedux.push('/admin/role'));
  }

  handleStandardTableChange = (pagination, filtersArg, sorter) => {
    const { dispatch } = this.props;
    const params = {
      pageNumber: pagination.current,
      pageSize: pagination.pageSize,
    };
    if (sorter.field) {
      params.sorter = `${sorter.field}_${sorter.order}`;
    }
    dispatch({
      type: 'menus/fetchList',
      payload: params,
    });
  }

  columns = [
    {
      title: '页面名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '页面描述',
      dataIndex: 'description',
      key: 'description',
    },
  ];

  renderTreeNodes = (data = []) => {
    return data.map((item) => {
      if (item.children) {
        return (
          <TreeNode title={item.title} key={item.key} dataRef={item}>
            {this.renderTreeNodes(item.children)}
          </TreeNode>
        );
      }
      return <TreeNode {...item} />;
    });
  }

  render() {
    const { submitting, loading, menus: { menuTree: { data = [] } }, role } = this.props;
    const { getFieldDecorator } = this.props.form;

    return (
      <PageHeaderLayout title="添加角色">
        <Card>
          <Form
            onSubmit={this.handleSubmit}
            hideRequiredMark
            style={{ marginTop: 8 }}
          >
            <FormItem
              label="角色名称："
            >
              {getFieldDecorator('name', {
                rules: [{
                  required: true, message: '请输入标题',
                }],
                initialValue: role.roleDetail.role.name,
              })(
                <Input placeholder="给目标起个名字" />
              )}
            </FormItem>
            <FormItem
              label="角色描述："
            >
              {getFieldDecorator('description', {
                rules: [{
                  required: true, message: '请输入角色描述',
                }],
                initialValue: role.roleDetail.role.description,
              })(
                <TextArea placeholder="请输入角色描述" style={{ minHeight: 32 }} rows={4} />
              )}
            </FormItem>
          </Form>
          <Tree
            checkable
            onExpand={this.onExpand}
            expandedKeys={this.state.expandedKeys}
            autoExpandParent={this.state.autoExpandParent}
            onCheck={this.onCheck}
            checkedKeys={this.state.checkedKeys}
            onSelect={this.onSelect}
            loading={loading}
            selectedKeys={this.state.selectedKeys}
          >
            {this.renderTreeNodes(data)}
          </Tree>
          <Button type="primary" onClick={this.handleSubmit} loading={submitting}>
            提交
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={this.handleCancel}>取消</Button>
        </Card>
      </PageHeaderLayout>
    );
  }
}
