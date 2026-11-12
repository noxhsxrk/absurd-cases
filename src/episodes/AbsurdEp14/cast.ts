import '../AbsurdEp1/cast';   // the recurring cast: man, officers (offA/offB), judge
import {TOWN} from '../lifekit/people';
/** EP14: the man, two patrol officers (offA drives + cuffs, offB the interrogator / guard), the judge, townsfolk in the court gallery. */
export const POLICE = ['offA', 'offB'];
export const IDS = ['nai', ...POLICE, 'judge', ...TOWN];
