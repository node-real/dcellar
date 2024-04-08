import { trimStart } from 'lodash-es';

export type DragItemProps = {
  items: DataTransferItemList;
};

export type DragMonitorProps = {
  isOver: boolean;
};

export type TransferItemTree = {
  [key: string]: File;
};

export const readEntriesAsync = (reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> => {
  return new Promise((resolve, reject) => {
    reader.readEntries(
      (entries) => {
        resolve(entries);
      },
      (error) => reject(error),
    );
  });
};

export const readDirectoryEntries = async (directoryEntry: FileSystemDirectoryEntry) => {
  const reader = directoryEntry.createReader();
  let resultEntries: FileSystemEntry[] = [];

  const read = async function () {
    const entries = await readEntriesAsync(reader);
    if (entries.length > 0) {
      resultEntries = resultEntries.concat(entries);
      await read();
    }
  };
  await read();

  return resultEntries;
};

export const isFileEntry = (entry: FileSystemEntry): entry is FileSystemFileEntry => {
  return entry.isFile;
};

export const isDirectoryEntry = (entry: FileSystemEntry): entry is FileSystemDirectoryEntry => {
  return entry.isDirectory;
};

export const traverseEntry = async (
  entry: FileSystemEntry | null,
  tree: TransferItemTree = {},
): Promise<TransferItemTree> => {
  if (!entry) return tree;

  const path = trimStart(entry.fullPath, '/');

  if (isFileEntry(entry)) {
    return new Promise((resolve) => {
      entry.file((file) => {
        tree[path] = file;
        resolve(tree);
      });
    });
  }

  if (isDirectoryEntry(entry)) {
    const newPath = path + '/';
    tree[newPath] = new File([], newPath, { type: 'text/plain' });
    const entries = await readDirectoryEntries(entry);
    await Promise.all(entries.map((entry) => traverseEntry(entry, tree)));

    return tree;
  }

  return tree;
};

export const traverseTransferItems = async (items: DataTransferItemList) => {
  const trees = await Promise.all(
    Array.from(items, (item) => traverseEntry(item.webkitGetAsEntry())),
  );
  return trees.reduce((r, c) => ({ ...r, ...c }), {});
};
