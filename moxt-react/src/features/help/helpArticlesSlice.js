import { createSlice } from '@reduxjs/toolkit'
import { createId } from '../../services/createId'
import { createLocalStorage } from '../../services/createLocalStorage'
import { mergeRemoteById } from '@moxt/shared/utils/mergeRemoteById.js'

const storage = createLocalStorage('moxt-help-articles-v1')

const helpArticlesSlice = createSlice({
  name: 'helpArticles',
  initialState: { items: storage.read() ?? [] },
  reducers: {
    setAll(state, action) {
      if (action.payload.items) {
        state.items = mergeRemoteById(state.items, action.payload.items)
      }
    },

    createHelpArticle: {
      reducer(state, action) {
        state.items.unshift(action.payload)
      },
      prepare(values) {
        const now = new Date().toISOString()
        const translationGroupId = values.translationGroupId || createId('HELPGRP')
        return {
          payload: {
            id: values.id || `${translationGroupId}-${values.language || 'fr'}`,
            translationGroupId,
            category: values.category || 'documents',
            language: values.language || 'fr',
            title: values.title || '',
            summary: values.summary || '',
            content: values.content || '',
            sourceName: values.sourceName || '',
            sourceUrl: values.sourceUrl || '',
            verifiedAt: values.verifiedAt || now,
            pinned: values.pinned === true,
            status: values.status || 'published',
            authorId: values.authorId,
            authorName: values.authorName || '',
            createdAt: now,
            updatedAt: now,
          },
        }
      },
    },

    updateHelpArticle(state, action) {
      const article = state.items.find((item) => item.id === action.payload.id)
      if (!article) return
      Object.assign(article, action.payload.changes, { updatedAt: new Date().toISOString() })
    },

    deleteHelpArticle(state, action) {
      state.items = state.items.filter((item) => item.id !== action.payload)
    },
  },
})

export const { setAll, createHelpArticle, updateHelpArticle, deleteHelpArticle } =
  helpArticlesSlice.actions
export default helpArticlesSlice.reducer
