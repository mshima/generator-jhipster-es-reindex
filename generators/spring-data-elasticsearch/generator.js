import BaseApplicationGenerator from 'generator-jhipster/generators/base-application';
import { createNeedleCallback } from 'generator-jhipster/generators/base/support';
import { javaMainPackageTemplatesBlock } from 'generator-jhipster/generators/java/support';
import { javaBeanCase } from 'generator-jhipster/generators/server/support';

export default class extends BaseApplicationGenerator {
  constructor(args, opts, features) {
    super(args, opts, { ...features, sbsBlueprint: true });
  }

  async beforeQueue() {
    if (!this.delegateToBlueprint) {
      await this.dependsOnJHipster('server');
    }
  }

  get [BaseApplicationGenerator.PREPARING]() {
    return this.asPreparingTaskGroup({
      async preparingTemplateTask({ source, application }) {
        source.addElasticsearchReindexer = ({ persistClass, primaryKeyName, entityClass, entityAbsolutePackage }) =>
          this.editFile(
            `${application.srcMainJava}${application.packageFolder}config/ElasticsearchReindexer.java`,
            createNeedleCallback({
              needle: 'elasticsearch-reindex-add-entity',
              contentToCheck: `    ${persistClass}(`,
              contentToAdd: `
    ${persistClass}(
        "${primaryKeyName}",
        ${entityAbsolutePackage}.repository.${entityClass}Repository.class,
        ${entityAbsolutePackage}.repository.search.${entityClass}SearchRepository.class
    ),
`,
            }),
          );
        source.addElasticsearchProperty = ({ propertyName, propertyType }) =>
          this.editFile(
            `${application.srcMainJava}${application.packageFolder}config/ApplicationProperties.java`,
            createNeedleCallback({
              needle: 'application-properties-property',
              contentToAdd: `    private ${propertyType} ${propertyName};`,
            }),
            createNeedleCallback({
              needle: 'application-properties-property-getter',
              contentToAdd: `
public ${propertyType} get${javaBeanCase(propertyName)}() {
    return ${propertyName};
}

public void set${javaBeanCase(propertyName)}(${propertyType} ${propertyName}) {
    this.${propertyName} = ${propertyName};
}
`,
            }),
          );
      },
    });
  }

  get [BaseApplicationGenerator.WRITING]() {
    return this.asWritingTaskGroup({
      async writingTemplateTask({ application }) {
        await this.writeFiles({
          blocks: [
            javaMainPackageTemplatesBlock({
              templates: ['config/ElasticsearchReindexer.java'],
            }),
          ],
          context: application,
        });
      },
    });
  }

  get [BaseApplicationGenerator.POST_WRITING]() {
    return this.asPostWritingTaskGroup({
      async postWritingTemplateTask({ source }) {
        source.addElasticsearchProperty({
          propertyName: 'elasticsearchReindexer',
          propertyType: 'Boolean',
        });
        this.editFile('src/main/resources/config/application-dev.yml', { assertModified: true }, content =>
          content.replace(
            /(?:# )?application:/,
            `application:
  elasticsearch-reindexer: true
`,
          ),
        );
      },
    });
  }

  get [BaseApplicationGenerator.POST_WRITING_ENTITIES]() {
    return this.asPostWritingEntitiesTaskGroup({
      async postWritingEntitiesTemplateTask({ entities, source }) {
        for (const entity of entities.filter(entity => entity.searchEngine === 'elasticsearch' && !entity.builtInUserManagement)) {
          const { persistClass, entityClass, entityAbsolutePackage } = entity;
          const primaryKeyName = entity.primaryKey.name;
          source.addElasticsearchReindexer({ persistClass, primaryKeyName, entityClass, entityAbsolutePackage });
        }
      },
    });
  }
}
