# react-sheets
A google sheets like feature written in react

## Goals
1. Typescript.
2. Performance, must load a dataset with 100k+ records at the same speed as 1,000 records.
3. Smooth scrolling, ideally the table will scroll at 60fps no matter what the dataset size.
5. Simple editing experience that mimics google sheets.
6. Rows and cells that support dynamic sizes.
7. Header cells that support dynamic height based on render header contents. (Looking to the future of a pluggable architecture).
8. Responsive with decent resize performance.
9. Use a web worker data model to allow for off main thread data processing.

## Future improvements
1. Web worker isn't really used for anything yet, it would be ideal for implementing an in memory filter.
2. Adding theming for colors and responsive sizes.
3. Create a pluggable architecture allowing for dynamic customizations of core components.
4. Better windowing of the view model to prevent scanning a very large dataset when responding to UI events (WorkerGridModel.calculateNextViewport).
5. Implemention simple row filters for distinct values.
