export const uniqueCount = (arr) => {
  const uniqueCountObject = {};

  for (const element of arr) {
    if (uniqueCountObject[element]) {
      uniqueCountObject[element] += 1;
    } else {
      uniqueCountObject[element] = 1;
    }
  }
  return uniqueCountObject;
};
