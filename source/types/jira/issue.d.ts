declare type Issue = {
  key: string
  summary: string
  issuetype: {
    self: string
    id: string
    description: string
    iconUrl: string
    name: string
    subtask: boolean
  }
  parent?: {
    key: string
  }
  description: string | null
  assignee: {
    self: string
    accountId: string
    emailAddress: string
    displayName: string
    active: boolean
  }
  priority: {
    self: string
    iconUrl: string
    name: string
    id: string
  }
  status: {
    self: string
    description: string
    iconUrl: string
    name: string
    id: string
    statusCategory: {
      self: string
      id: number
      key: string
      colorName: string
      name: string
    }
  }
  display: string
}
