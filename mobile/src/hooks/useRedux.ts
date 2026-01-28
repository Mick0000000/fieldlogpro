/**
 * Typed Redux Hooks
 *
 * These hooks provide properly typed versions of useSelector and useDispatch.
 * Using these instead of the plain hooks gives you autocomplete and type checking.
 */

import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';

// Use throughout your app instead of plain `useDispatch`
export const useAppDispatch: () => AppDispatch = useDispatch;

// Use throughout your app instead of plain `useSelector`
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
