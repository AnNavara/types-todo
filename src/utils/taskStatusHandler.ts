import { DEADLINE_ALWAYS_ACTIVE, weekDays } from './consts';
import { ITask } from '../Interfaces';
import { convertMsToDays } from './utils';

interface ITaskStatusResult {
    active: boolean;
    isToday(day: string): boolean;
    deadlineDate: string;
}

const taskStatusHandler = (task: ITask): ITaskStatusResult => {

    let completedBefore: boolean = false;
    if (task.lastCompletion) completedBefore = true;
    let lastCompletion: Date = new Date(0);
    if (task.lastCompletion) lastCompletion = new Date(task.lastCompletion);
    let active = false;

    //
    // Day of the week handling
    //
    // is input day of the week is today
    const isToday = (day: string): boolean => {
        return new Date().getDay() === weekDays.indexOf(day) + 1;
    };
    // is Task active days contains today
    const isTaskDayActive = (): boolean => {
        let activeDay = false;
        // Task active day if any weekday
        if (task.repeatDays.length === 0) return true;
        task.repeatDays.forEach((day: string) => {
            if (isToday(day)) {
                activeDay = true;
            }
        });
        return activeDay;
    };

    const isLastYear = (): boolean => {
        return lastCompletion.getFullYear() <= (new Date()).getFullYear()
    }

    const isLastMonth = (): boolean => {
        return isLastYear() && lastCompletion.getMonth() <= (new Date()).getMonth()
    }

    const isYesturday = (): boolean => {
        return isLastYear()
        && isLastMonth()
        && lastCompletion.getDate() < (new Date()).getDate()
    }

    //
    // Week Handling
    //
    const sundayOfDateWeek = (date: Date): Date => {
        const DECEMBER = 11 as const;
        const JUNUARY = 0 as const;
        const SUNDAY_DAY = 0 as const;
        const DAYS_IN_WEEK = 7 as const;
        let sunday: Date;
        if (date.getDay() === SUNDAY_DAY) return date;
        const sundayDate: number = date.getDate() + DAYS_IN_WEEK - date.getDay();
        const lastDayOfMonth: number = (new Date(date.getFullYear(), date.getMonth() + 1, 0)).getDate();

        if (sundayDate > lastDayOfMonth && date.getMonth() === DECEMBER) {
            sunday = new Date(date.getFullYear() + 1, JUNUARY, sundayDate - lastDayOfMonth + 1);
        } else if (sundayDate > lastDayOfMonth) {
            sunday = new Date(date.getFullYear(), date.getMonth() + 1, sundayDate - lastDayOfMonth + 1);
        } else {
            sunday = new Date(date.getFullYear(), date.getMonth(), sundayDate);
        }
        return sunday;
    }

    //
    // Repeat Handling
    //
    // task active if yet to be completed and today is active day
    if (!completedBefore && isTaskDayActive()) active = true;
    // task active if it doesn't have to be repeated
    if (task.repeatSpread === 'Не повторять') active = true
    // Repeated tasks can only be inactive if they weren't completed before
    if (completedBefore) {
        // task active if it have to be repeated everyday
        // wasn't completed today and today is active day for the task
        if (task.repeatSpread === 'Ежедневно'
            && isYesturday()
            && isTaskDayActive()
        ) {
            console.log((new Date()).getDate())
            active = true;
        }

        if (
            task.repeatSpread === 'Еженедельно'
            && sundayOfDateWeek(lastCompletion) <= new Date()
            && isTaskDayActive()
        ) active = true;

        if (
            task.repeatSpread === 'Ежемесячно'
            && (lastCompletion.getMonth() < new Date().getMonth()
            || lastCompletion.getFullYear() < new Date().getFullYear())
            && isTaskDayActive()
        ) active = true;
    }

    //
    // Deadline handling
    //
    let deadlineDate = '';
    if (+task.deadline !== 0) {
        let deadline = new Date(task.date);
        deadline.setDate(deadline.getDate() + +task.deadline);
        deadlineDate = Intl.DateTimeFormat('ru-RU', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(deadline);

        // Task allways active if deadline approaching
        if (
            convertMsToDays(deadline.getTime() - new Date().getTime()) <= DEADLINE_ALWAYS_ACTIVE
            && task.deadline !== 0
        ) active = true;
    }

    return { active, isToday, deadlineDate };
};

export default taskStatusHandler;
