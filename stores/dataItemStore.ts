export const useDataItemStore = defineStore('dataItem', () => {
  const dataItems: Ref<DataItem[]> = ref([])

  const addedDataItemIds = new Set()

  function add(dataItem: DataItem): boolean {
    if (!addedDataItemIds.has(dataItem.id)) {
      dataItems.value.push(dataItem)
      addedDataItemIds.add(dataItem.id)
      return true
    }
    return false
  }

  function remove(id: string): boolean {
    if (addedDataItemIds.has(id)) {
      addedDataItemIds.delete(id)
      dataItems.value = dataItems.value.filter(item => item.id !== id)
      return true
    }
    return false
  }

  return {
    dataItems,
    add,
    remove,
  }
})
