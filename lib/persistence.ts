'use client';

import { Dispatch, SetStateAction, useState } from 'react';

function saveToLocalStorage<T extends object>(key: string, value: T): void {
  if (typeof localStorage === 'undefined') {
    console.error('Local storage is not available.');
    return;
  }

  try {
    if (value) {
      const nonEmptySettings = Object.fromEntries(
        Object.entries(value).filter(([, value]) => value !== ''),
      );
      localStorage.setItem(key, JSON.stringify(nonEmptySettings));
    }
  } catch (error) {
    console.error(`Error setting item to local storage: ${error}`);
  }
}

function loadFromLocalStorage<T extends object>(key: string): T | undefined {
  if (typeof localStorage === 'undefined') {
    console.error('Local storage is not available.');
    return undefined;
  }

  try {
    const item = localStorage.getItem(key);
    if (!item) {
      console.warn(`Item with key ${key} does not exist in local storage.`);
      return undefined;
    }
    return JSON.parse(item);
  } catch (error) {
    console.error(`Error getting item from local storage: ${error}`);
    return undefined;
  }
}

export function createLocalStorageInterface<T extends object>(
  key: string,
): { load: () => T | undefined; save: (value: T) => void } {
  return {
    load: () => loadFromLocalStorage<T>(key),
    save: (value: T) => saveToLocalStorage<T>(key, value),
  };
}

export function usePersistToLocalStorage<T extends object>(
  key: string,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const storedValue = loadFromLocalStorage<T>(key);
    return storedValue !== undefined ? storedValue : initialValue;
  });

  const saveValue = (dispatch: SetStateAction<T>) => {
    if (typeof dispatch === 'function') {
      setValue((prev) => {
        const next = dispatch(prev);
        saveToLocalStorage(key, next);
        return next;
      });
    } else {
      setValue(dispatch);
      saveToLocalStorage(key, dispatch);
    }
  };

  return [value, saveValue];
}
