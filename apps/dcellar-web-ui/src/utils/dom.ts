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
    const reader = entry.createReader();
    return new Promise((resolve) => {
      reader.readEntries(async (entries) => {
        const entryTree = await Promise.all(entries.map((entry) => traverseEntry(entry, tree)));
        resolve(entryTree.reduce((r, c) => ({ ...r, ...c }), {}));
      });
    });
  }
  return tree;
};

export const traverseTransferItems = async (items: DataTransferItemList) => {
  const trees = await Promise.all(
    Array.from(items, (item) => traverseEntry(item.webkitGetAsEntry())),
  );
  return trees.reduce((r, c) => ({ ...r, ...c }), {});
};
