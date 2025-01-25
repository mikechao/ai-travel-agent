export const useDataItemStore = defineStore('dataItem', () => {
  const dataItems: Ref<DataItem[]> = ref([])

  const addedDataItemIds = new Set()

  function add(dataItem: DataItem) {
    if (!addedDataItemIds.has(dataItem.id)) {
      dataItems.value.push(dataItem)
      addedDataItemIds.add(dataItem.id)
    }
  }

  function remove(id: string) {
    if (addedDataItemIds.has(id)) {
      addedDataItemIds.delete(id)
      dataItems.value = dataItems.value.filter(item => item.id !== id)
    }
  }

  return {
    dataItems,
    add,
    remove,
  }
})
