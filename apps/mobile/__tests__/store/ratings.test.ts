import { configureStore } from '@reduxjs/toolkit';

import { ratingsReducer } from '../../store/ratings';

function createStore() {
  return configureStore({ reducer: { ratings: ratingsReducer } });
}

describe('ratings slice', () => {
  it('starts with empty state', () => {
    const store = createStore();
    const state = store.getState().ratings;
    expect(state.received).toEqual([]);
    expect(state.given).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.averageScore).toBeNull();
  });
});
