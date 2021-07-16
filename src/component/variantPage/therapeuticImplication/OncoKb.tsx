import * as React from 'react';
import { observer } from 'mobx-react';
import _ from 'lodash';
// TODO remove the IndicatorQueryTreatment import after exposed in cbioportal-frontend-commons
import {
    IndicatorQueryResp,
    IndicatorQueryTreatment,
} from 'oncokb-ts-api-client';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { generateOncokbLink, ONCOKB_URL } from '../biologicalFunction/Oncokb';

import functionalGroupsStyle from '../functionalGroups.module.scss';
import DrugList from '../DrugList';

interface IOncoKbProps {
    oncokb: IndicatorQueryResp | undefined;
    isCanonicalTranscriptSelected: boolean;
}

export const SENSITIVE_LEVELS = [
    'LEVEL_1',
    'LEVEL_2',
    'LEVEL_3',
    'LEVEL_3A',
    'LEVEL_3B',
    'LEVEL_4',
];

export const RESISTANT_LEVELS = ['LEVEL_R1', 'LEVEL_R2'];

@observer
class OncoKb extends React.Component<IOncoKbProps> {
    public sensitiveDrugs(
        oncokbData: IndicatorQueryResp | undefined,
        oncokbUrl: string
    ) {
        const treatmentsGroupByLevel = this.getTreatmentsGroupByLevel(
            oncokbData
        ); // group treatments by level
        if (
            oncokbData &&
            oncokbData.highestSensitiveLevel &&
            treatmentsGroupByLevel
        ) {
            const sensitiveTreatmentLevels = this.getSensitiveTreatmentLevels(
                treatmentsGroupByLevel
            ); // get all sensitive levels in this mutation
            const sensitiveDrugs = this.allDrugs(
                treatmentsGroupByLevel,
                sensitiveTreatmentLevels
            );
            return (
                <DrugList
                    title="Sensitive to:"
                    drugs={sensitiveDrugs}
                    url={oncokbUrl}
                />
            );
        }
        return null;
    }

    public resistantDrugs(
        oncokbData: IndicatorQueryResp | undefined,
        oncokbUrl: string
    ) {
        const treatmentsGroupByLevel = this.getTreatmentsGroupByLevel(
            oncokbData
        ); // group treatments by level
        if (
            oncokbData &&
            oncokbData.highestResistanceLevel &&
            treatmentsGroupByLevel
        ) {
            const resistantTreatmentLevels = this.getResistantTreatmentLevels(
                treatmentsGroupByLevel
            ); // get all resistant levels in this mutation
            const resistantDrugs = this.allDrugs(
                treatmentsGroupByLevel,
                resistantTreatmentLevels
            );
            return (
                <DrugList
                    title="Resistant to:"
                    drugs={resistantDrugs}
                    url={oncokbUrl}
                />
            );
        }
        return null;
    }

    private allDrugs(
        treatmentsGroupByLevel: { [level: string]: IndicatorQueryTreatment[] },
        levels: string[]
    ) {
        const drugs: any[] = [];

        _.forEach(levels, level => {
            drugs.push(
                _.chain(treatmentsGroupByLevel[level])
                    .flatMap(treatment => treatment.drugs)
                    .map(drug => drug.drugName)
                    .uniq()
                    .value()
            );
        });

        return _.chain(drugs)
            .flatMap()
            .uniq()
            .value();
    }

    private getTreatmentsGroupByLevel(
        oncokbData: IndicatorQueryResp | undefined
    ): { [level: string]: IndicatorQueryTreatment[] } | undefined {
        if (oncokbData && oncokbData.treatments) {
            return _.groupBy(
                oncokbData.treatments,
                treatment => treatment.level
            );
        }
        return undefined;
    }

    private getSensitiveTreatmentLevels(treatmentsGroupByLevel: {
        [level: string]: IndicatorQueryTreatment[];
    }) {
        return _.chain(treatmentsGroupByLevel)
            .keys()
            .filter(level => SENSITIVE_LEVELS.includes(level))
            .uniq()
            .value();
    }

    private getResistantTreatmentLevels(treatmentsGroupByLevel: {
        [level: string]: IndicatorQueryTreatment[];
    }) {
        return _.chain(treatmentsGroupByLevel)
            .keys()
            .filter(level => RESISTANT_LEVELS.includes(level))
            .uniq()
            .value();
    }

    public oncokbTooltip(oncokbUrl: string) {
        return (
            <DefaultTooltip
                placement="top"
                overlay={
                    <div style={{ maxWidth: 350 }}>
                        <a
                            href={oncokbUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            OncoKB
                        </a>{' '}
                        is a precision oncology knowledge base and contains
                        information about the effects and treatment implications
                        of specific cancer gene alterations.
                    </div>
                }
            >
                <a href={oncokbUrl} target="_blank" rel="noopener noreferrer">
                    OncoKB&nbsp;
                    <i className="fas fa-external-link-alt" />
                    {!this.props.isCanonicalTranscriptSelected && (
                        <span> *</span>
                    )}
                </a>
            </DefaultTooltip>
        );
    }

    public render() {
        const oncokbUrl = generateOncokbLink(ONCOKB_URL, this.props.oncokb);
        const sensitiveDrugs = this.sensitiveDrugs(
            this.props.oncokb,
            oncokbUrl
        );
        const resistantDrugs = this.resistantDrugs(
            this.props.oncokb,
            oncokbUrl
        );
        return sensitiveDrugs || resistantDrugs ? (
            <div className={functionalGroupsStyle['functional-group']}>
                <div className={functionalGroupsStyle['data-source']}>
                    {this.oncokbTooltip(oncokbUrl)}
                </div>
                <div className={functionalGroupsStyle['data-with-link']}>
                    {sensitiveDrugs}
                    {resistantDrugs}
                </div>
            </div>
        ) : (
            <div className={functionalGroupsStyle['functional-group']}>
                <div className={functionalGroupsStyle['data-source']}>
                    {this.oncokbTooltip(oncokbUrl)}
                </div>
                <div className={functionalGroupsStyle['data-with-link']}>
                    <a
                        href={oncokbUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        N/A
                    </a>
                </div>
            </div>
        );
    }
}

export default OncoKb;